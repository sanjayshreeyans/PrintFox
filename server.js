import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { pdf } from 'pdf-to-img';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const ipp = require('ipp');
const { encodePWG, ColorSpace } = require('bitmap-to-pwg');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ dest: 'uploads/' });

// In-memory job store: jobId → { pages: [{path, size}], name }
const jobs = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

// GET /api/printers — auto-discover IPP printers on the local network using ippfind
// ippfind is bundled with CUPS and available on macOS (10.11+) and most Linux distros.
// `ippfind -s -p` outputs alternating lines: friendly name, then IPP URI.
// Falls back to an empty list if ippfind is not available.
app.get('/api/printers', async (req, res) => {
  try {
    const { execSync } = await import('child_process');
    const printers = [];

    // Primary: ippfind (CUPS-bundled, works on macOS + Linux, no system printer config needed)
    try {
      const raw = execSync('ippfind -s -p 2>/dev/null', { encoding: 'utf8', timeout: 8000 });
      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
      // Output format: name\nuri\nname\nuri\n...
      for (let i = 0; i + 1 < lines.length; i += 2) {
        const name = lines[i];
        const uri  = lines[i + 1];
        if (uri && (uri.startsWith('ipp://') || uri.startsWith('ipps://'))) {
          printers.push({ name, uri });
        }
      }
    } catch { /* ippfind not available */ }

    // Fallback: lpstat -v (only works if system printers are configured — often empty on locked-down Macs)
    if (printers.length === 0) {
      try {
        const raw = execSync('lpstat -v 2>/dev/null', { encoding: 'utf8', timeout: 5000 });
        for (const line of raw.split('\n')) {
          const match = line.match(/device for (.+?):\s+(ipps?:\/\/.+)/);
          if (match) printers.push({ name: match[1].trim(), uri: match[2].trim() });
        }
      } catch { /* ignore */ }
    }

    res.json({ printers });
  } catch {
    res.json({ printers: [] });
  }
});

// POST /api/convert
// - Converts PDF → 300 DPI PNGs saved on disk (server side)
// - Returns a jobId + small preview thumbnails (low-res, for display only)
app.post('/api/convert', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const jobId = crypto.randomUUID();
  const jobDir = path.join(__dirname, 'uploads', jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  try {
    // Full-res 300 DPI pass — saved to disk, NOT sent to browser
    const doc300 = await pdf(req.file.path, { scale: 4.17 });
    const pageMeta = [];
    let i = 1;
    for await (const buf of doc300) {
      const p = path.join(jobDir, `page${i}.png`);
      fs.writeFileSync(p, buf);
      pageMeta.push({ index: i, path: p, size: buf.length });
      i++;
    }

    // Low-res preview pass — small enough to send to browser
    const docPreview = await pdf(req.file.path, { scale: 1.5 });
    const previews = [];
    i = 1;
    for await (const buf of docPreview) {
      previews.push({
        index: i,
        dataUrl: 'data:image/png;base64,' + buf.toString('base64'),
        size: pageMeta[i - 1].size,
      });
      i++;
    }

    fs.unlinkSync(req.file.path);

    jobs.set(jobId, { pages: pageMeta, name: req.file.originalname || 'document.pdf' });

    res.json({ jobId, pages: previews, total: previews.length });
  } catch (err) {
    try { fs.unlinkSync(req.file.path); } catch {}
    try { fs.rmSync(jobDir, { recursive: true }); } catch {}
    res.status(500).json({ error: err.message });
  }
});

// POST /api/print — reads 300 DPI PNGs from disk by jobId, streams to IPP printer
app.post('/api/print', async (req, res) => {
  const {
    jobId,
    printerUri,
    jobName    = 'PDF Print Job',
    pageRange  = '',          // e.g. "1-2,4" or "" for all
    copies     = 1,
    colorMode  = 'color',     // 'color' | 'grayscale'
    duplex     = 'one-sided', // 'one-sided' | 'two-sided-long-edge' | 'two-sided-short-edge'
  } = req.body;

  if (!jobId || !printerUri) {
    return res.status(400).json({ error: 'Missing jobId or printerUri' });
  }

  const job = jobs.get(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found — re-upload the PDF' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Parse page range string → 0-based indices
  const parseRange = (str, total) => {
    if (!str || !str.trim()) return Array.from({ length: total }, (_, i) => i);
    const pages = new Set();
    for (const part of str.split(',')) {
      const sides = part.trim().split('-').map(n => parseInt(n.trim(), 10) - 1);
      if (isNaN(sides[0])) continue;
      if (sides.length === 1 || isNaN(sides[1])) {
        if (sides[0] >= 0 && sides[0] < total) pages.add(sides[0]);
      } else {
        for (let i = sides[0]; i <= Math.min(sides[1], total - 1); i++) {
          if (i >= 0) pages.add(i);
        }
      }
    }
    return [...pages].sort((a, b) => a - b);
  };

  try {
    const indices = parseRange(pageRange, job.pages.length);
    if (indices.length === 0) {
      send({ type: 'error', message: 'Page range produced no pages' });
      return res.end();
    }

    const totalPages = indices.length;
    const PWG_SYNC = 4; // "RaS2" header length

    send({ type: 'encoding', total: totalPages });

    // Pre-encode every selected page to its own PWG buffer
    const pwgBuffers = [];
    for (let p = 0; p < indices.length; p++) {
      const { path: imgPath } = job.pages[indices[p]];

      // Flatten alpha → white, force 3-channel RGB.
      // Grayscale conversion is done in getPixel, keeping 3ch for PWG encoder.
      const { data, info } = await sharp(imgPath)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { width, height } = info;
      const isGray = (colorMode === 'grayscale');

      // ── Blank / Black-page guard ──────────────────────────────────────────
      // Sample mean luminance. If the whole page is nearly black (e.g. <10/255)
      // it almost certainly indicates a rendering or encoding bug — warn the
      // client so the user can see it in the UI before it hits the printer.
      let lumaSum = 0;
      for (let i = 0; i < data.length; i += 3) {
        lumaSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const meanLuma = lumaSum / (data.length / 3);
      if (meanLuma < 10) {
        send({ type: 'warning', page: p + 1, message: `Page ${indices[p] + 1} is almost entirely black (mean luma ${meanLuma.toFixed(1)}). This may indicate a rendering bug. The page will still be sent.` });
      }

      const getPixel = (x, y) => {
        const i = (y * width + x) * 3;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (isGray) {
          const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          return { r: luma, g: luma, b: luma };
        }
        return { r, g, b };
      };

      pwgBuffers.push(Buffer.from(encodePWG(width, height, ColorSpace.Rgb, getPixel, 300)));
      send({ type: 'encoded', page: p + 1, of: totalPages });
    }

    // ── Concatenate all pages into ONE PWG raster stream ──
    // PWG format: "RaS2" (4 bytes, once) then page_header+raster per page.
    // Each encodePWG() output starts with its own "RaS2"; strip it from pages 2+.
    const fullStream = Buffer.concat([
      pwgBuffers[0],
      ...pwgBuffers.slice(1).map(buf => buf.slice(PWG_SYNC)),
    ]);

    send({ type: 'sending', totalPages, copies, sizeKB: Math.round(fullStream.length / 1024) });

    // Send one Print-Job per copy (all pages in one shot — no delays!)
    for (let copy = 1; copy <= copies; copy++) {
      send({ type: 'progress', copy, copies, status: 'sending' });

      await new Promise((resolve, reject) => {
        const printer = ipp.Printer(printerUri);
        printer.execute('Print-Job', {
          'operation-attributes-tag': {
            'requesting-user-name': 'print-tool',
            'job-name': copies > 1 ? `${jobName} (copy ${copy})` : jobName,
            'document-format': 'image/pwg-raster',
          },
          'job-attributes-tag': {
            'sides': duplex,
          },
          data: fullStream,
        }, (err, result) => {
          if (err) return reject(err);
          const ok = ['successful-ok', 'successful-ok-ignored-or-substituted-attributes'];
          if (!ok.includes(result?.statusCode)) {
            return reject(new Error(`Printer: ${result?.statusCode}`));
          }
          resolve(result);
        });
      });

      send({ type: 'progress', copy, copies, status: 'done' });

      // Brief delay between copies only
      if (copy < copies) await new Promise(r => setTimeout(r, 5000));
    }

    send({ type: 'complete', pages: totalPages, copies });

    // Clean up disk after successful print
    try { fs.rmSync(path.join(__dirname, 'uploads', jobId), { recursive: true }); } catch {}
    jobs.delete(jobId);
  } catch (err) {
    send({ type: 'error', message: err.message });
  }

  res.end();
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🖨️  Print Tool server running at http://localhost:${PORT}\n`);
});
