import React, { useState, useCallback, useRef, useEffect } from 'react';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const UploadIcon  = () => <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />;
const PrintIcon   = () => <Icon d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />;
const CheckIcon   = () => <Icon d="M20 6L9 17l-5-5" color="#22c55e" />;
const SpinnerIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
      style={{ animation: 'spin 1s linear infinite', transformOrigin: 'center' }} />
  </svg>
);
const FileIcon = () => <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />;
const TrashIcon = () => <Icon d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />;
const EyeIcon  = () => <Icon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />;
const XIcon    = () => <Icon d="M18 6L6 18M6 6l12 12" />;

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f1117 0%, #1a1d27 100%)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    borderBottom: '1px solid #2e3350',
    padding: '0 32px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backdropFilter: 'blur(10px)',
    background: 'rgba(26,29,39,0.8)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    width: 36, height: 36,
    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 700, color: '#f1f5f9' },
  headerSub: { fontSize: 12, color: '#94a3b8', marginLeft: 'auto',
    background: '#22263a', padding: '4px 12px', borderRadius: 20,
    border: '1px solid #2e3350' },

  main: { flex: 1, padding: '40px 32px', maxWidth: 1100, margin: '0 auto', width: '100%' },

  grid: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' },

  card: {
    background: '#1a1d27',
    border: '1px solid #2e3350',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
  cardHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #2e3350',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#f1f5f9' },
  cardBody: { padding: 24 },

  dropzone: (dragging) => ({
    border: `2px dashed ${dragging ? '#6366f1' : '#2e3350'}`,
    borderRadius: 14,
    padding: '60px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: dragging ? 'rgba(99,102,241,0.08)' : 'transparent',
  }),
  dropIcon: {
    width: 64, height: 64,
    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(129,140,248,0.1))',
    borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },

  badge: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: color === 'green' ? 'rgba(34,197,94,0.15)' :
                color === 'blue'  ? 'rgba(99,102,241,0.15)' :
                color === 'amber' ? 'rgba(245,158,11,0.15)' :
                                    'rgba(148,163,184,0.15)',
    color: color === 'green' ? '#22c55e' :
           color === 'blue'  ? '#818cf8' :
           color === 'amber' ? '#f59e0b' : '#94a3b8',
    border: `1px solid ${
      color === 'green' ? 'rgba(34,197,94,0.3)' :
      color === 'blue'  ? 'rgba(99,102,241,0.3)' :
      color === 'amber' ? 'rgba(245,158,11,0.3)' :
                          'rgba(148,163,184,0.2)'}`,
  }),

  btn: (variant = 'primary', disabled = false) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '12px 24px', borderRadius: 10, border: 'none',
    fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s', width: '100%',
    opacity: disabled ? 0.5 : 1,
    background: variant === 'primary'
      ? (disabled ? '#3730a3' : 'linear-gradient(135deg, #6366f1, #818cf8)')
      : (variant === 'danger' ? 'rgba(239,68,68,0.15)' : '#22263a'),
    color: variant === 'danger' ? '#ef4444' : '#f1f5f9',
    border: variant === 'ghost' ? '1px solid #2e3350' :
            variant === 'danger' ? '1px solid rgba(239,68,68,0.3)' : 'none',
    boxShadow: (!disabled && variant === 'primary')
      ? '0 4px 15px rgba(99,102,241,0.4)' : 'none',
  }),

  input: {
    width: '100%', padding: '10px 14px',
    background: '#22263a', border: '1px solid #2e3350',
    borderRadius: 8, color: '#f1f5f9', fontSize: 13,
    outline: 'none',
  },
  label: { fontSize: 12, fontWeight: 600, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
    display: 'block' },

  progressBar: (pct) => ({
    height: 6, borderRadius: 99,
    background: `linear-gradient(90deg, #6366f1 ${pct}%, #22263a ${pct}%)`,
    transition: 'background 0.4s ease',
  }),

  pageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
    marginTop: 4,
  },
  pageThumb: (active) => ({
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    border: `2px solid ${active ? '#6366f1' : '#2e3350'}`,
    background: '#22263a',
    cursor: 'pointer',
    transition: 'border-color 0.2s, transform 0.15s',
    transform: active ? 'scale(1.02)' : 'scale(1)',
  }),
  pageImg: { width: '100%', display: 'block' },
  pageLabel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '6px 10px',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    fontSize: 11, fontWeight: 600, color: '#f1f5f9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },

  toast: (type) => ({
    position: 'fixed', bottom: 24, right: 24,
    padding: '14px 20px', borderRadius: 12,
    background: type === 'success' ? '#16a34a' :
                type === 'error'   ? '#dc2626' : '#4338ca',
    color: '#fff', fontSize: 14, fontWeight: 500,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
    animation: 'slideIn 0.3s ease',
    maxWidth: 360,
  }),
};

// ─── PreviewPageCard (with dark-page heuristic) ──────────────────────────────
function PreviewPageCard({ page, idx, colorMode }) {
  const [darkWarning, setDarkWarning] = React.useState(false);
  const imgRef = React.useRef();

  const checkLuminance = React.useCallback((img) => {
    try {
      const canvas = document.createElement('canvas');
      const scale  = 0.15; // sample at 15% size — fast and accurate enough
      canvas.width  = Math.max(1, Math.round(img.naturalWidth  * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) {
        sum += 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      }
      const meanLuma = sum / (d.length / 4);
      setDarkWarning(meanLuma < 18); // threshold: almost entirely black
    } catch (_) {}
  }, []);

  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      border: darkWarning ? '2px solid #f59e0b' : '1px solid #2e3350',
      background: '#22263a', position: 'relative',
      boxShadow: darkWarning ? '0 0 0 3px rgba(245,158,11,0.25)' : 'none',
      transition: 'border 0.2s',
    }}>
      <img
        ref={imgRef}
        src={page.dataUrl}
        alt={`Page ${page.index}`}
        style={{ width: '100%', display: 'block',
          filter: colorMode === 'grayscale' ? 'grayscale(100%)' : 'none',
        }}
        onLoad={e => checkLuminance(e.currentTarget)}
        crossOrigin="anonymous"
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '8px 12px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 11, fontWeight: 600, color: '#f1f5f9',
      }}>
        <span>Page {page.index}</span>
        <span style={{ color: '#94a3b8' }}>{(page.size / 1024).toFixed(0)} KB</span>
      </div>
      {darkWarning && (
        <div style={{
          position: 'absolute', top: 8, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
        }}>
          <span style={{
            background: 'rgba(245,158,11,0.92)', color: '#000',
            borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
          }}>
            ⚠️ Page looks very dark
          </span>
        </div>
      )}
      {/* Grayscale B&W badge */}
      {colorMode === 'grayscale' && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(0,0,0,0.6)', color: '#cbd5e1',
          borderRadius: 20, padding: '3px 8px', fontSize: 10, fontWeight: 600,
        }}>
          B&W
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [pages, setPages]             = useState([]);
  const [jobId, setJobId]             = useState(null);
  const [fileName, setFileName]       = useState('');
  const [dragging, setDragging]       = useState(false);
  const [converting, setConverting]   = useState(false);
  const [printing, setPrinting]       = useState(false);
  const [printProgress, setPrintProgress] = useState({ copy: 0, copies: 1, status: '', totalPages: 0, sizeKB: 0 });
  const [encodingProgress, setEncodingProgress] = useState({ done: 0, total: 0 });
  const [printerUri, setPrinterUri]   = useState('');
  const [printers, setPrinters]       = useState([]);
  const [savedPrinters, setSavedPrinters] = useState(() => {
    try { return JSON.parse(localStorage.getItem('printfox_printers') || '[]'); }
    catch { return []; }
  });
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [newPrinterUri, setNewPrinterUri]   = useState('');
  const [newPrinterName, setNewPrinterName] = useState('');
  const [showHowToFind, setShowHowToFind]   = useState(false);
  const [jobName, setJobName]         = useState('PDF Print Job');
  const [pageRange, setPageRange]     = useState('');
  const [copies, setCopies]           = useState(1);
  const [colorMode, setColorMode]     = useState('color');
  const [duplex, setDuplex]           = useState('one-sided');
  const [toast, setToast]             = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [printDone, setPrintDone]     = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef();

  // Parse "1-3, 5, 7-9" → array of 1-based page numbers
  const parsePageRangeFn = (str, total) => {
    if (!str || !str.trim()) return Array.from({ length: total }, (_, i) => i + 1);
    const result = new Set();
    for (const part of str.split(',')) {
      const sides = part.trim().split('-').map(n => parseInt(n.trim(), 10));
      if (isNaN(sides[0])) continue;
      if (sides.length === 1 || isNaN(sides[1])) {
        if (sides[0] >= 1 && sides[0] <= total) result.add(sides[0]);
      } else {
        for (let i = sides[0]; i <= Math.min(sides[1], total); i++) {
          if (i >= 1) result.add(i);
        }
      }
    }
    return [...result].sort((a, b) => a - b);
  };

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Persist savedPrinters to localStorage whenever they change
  useEffect(() => {    localStorage.setItem('printfox_printers', JSON.stringify(savedPrinters));
  }, [savedPrinters]);

  // Load available printers on mount
  useEffect(() => {
    fetch('/api/printers')
      .then(r => r.json())
      .then(({ printers }) => {
        setPrinters(printers);
        // Pick first available: prefer saved list, then auto-discovered
        const saved = JSON.parse(localStorage.getItem('printfox_printers') || '[]');
        if (saved.length > 0) setPrinterUri(saved[0].uri);
        else if (printers.length > 0) setPrinterUri(printers[0].uri);
      })
      .catch(() => {});
  }, []);

  const savePrinter = (uri, name) => {
    const trimUri  = uri.trim();
    const trimName = name.trim() || trimUri;
    if (!trimUri || !trimUri.startsWith('ipp')) {
      showToast('URI must start with ipp:// or ipps://', 'error');
      return false;
    }
    setSavedPrinters(prev => {
      if (prev.some(p => p.uri === trimUri)) return prev; // already saved
      return [...prev, { uri: trimUri, name: trimName }];
    });
    setPrinterUri(trimUri);
    return true;
  };

  const deleteSavedPrinter = (uri) => {
    setSavedPrinters(prev => {
      const next = prev.filter(p => p.uri !== uri);
      if (printerUri === uri) setPrinterUri(next[0]?.uri || '');
      return next;
    });
  };

  const handleFile = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      showToast('Please upload a valid PDF file', 'error');
      return;
    }
    setPages([]); setPrintDone(false); setJobId(null);
    setFileName(file.name);
    setConverting(true);
    setJobName(file.name.replace('.pdf', ''));

    const form = new FormData();
    form.append('pdf', file);

    try {
      const res = await fetch('/api/convert', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPages(data.pages);
      setJobId(data.jobId);
      showToast(`✓ ${data.total} page${data.total > 1 ? 's' : ''} ready at 300 DPI`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConverting(false);
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handlePrint = async () => {
    if (!pages.length || !printerUri || !jobId) return;
    setPrinting(true); setPrintDone(false);
    setPrintProgress({ copy: 0, copies, status: '', totalPages: 0, sizeKB: 0 });
    setEncodingProgress({ done: 0, total: 0 });

    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, printerUri, jobName, pageRange, copies, colorMode, duplex }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const evt = JSON.parse(line.slice(6));
          if (evt.type === 'encoding') {
            setEncodingProgress({ done: 0, total: evt.total });
          } else if (evt.type === 'encoded') {
            setEncodingProgress(p => ({ ...p, done: evt.page }));
          } else if (evt.type === 'sending') {
            setPrintProgress(p => ({ ...p, totalPages: evt.totalPages, copies: evt.copies, sizeKB: evt.sizeKB }));
          } else if (evt.type === 'warning') {
            showToast(`⚠️ ${evt.message}`, 'info');
          } else if (evt.type === 'progress') {
            setPrintProgress(p => ({ ...p, copy: evt.copy, copies: evt.copies, status: evt.status }));
          } else if (evt.type === 'complete') {
            setPrintDone(true);
            showToast(`🖨️ ${evt.pages} page${evt.pages > 1 ? 's' : ''} × ${evt.copies} cop${evt.copies > 1 ? 'ies' : 'y'} sent!`, 'success');
          } else if (evt.type === 'error') {
            throw new Error(evt.message);
          }
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div style={s.app}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(120%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        select { appearance: none; }
        img { user-select: none; }
      `}</style>

      {/* Header */}
      <header style={s.header}>
        <div style={s.logo}>
          <PrintIcon />
        </div>
        <span style={s.headerTitle}>🦊 PrintFox</span>
        <span style={s.headerSub}>300 DPI · Pure JS · No system tools · Clever printing</span>
      </header>

      <main style={s.main}>
        <div style={s.grid}>

          {/* Left: Upload + Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Upload */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <UploadIcon />
                <span style={s.cardTitle}>Upload PDF</span>
                {pages.length > 0 && (
                  <span style={{ ...s.badge('green'), marginLeft: 'auto' }}>
                    <CheckIcon /> {pages.length} pages loaded
                  </span>
                )}
              </div>
              <div style={s.cardBody}>
                <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])} />

                {converting ? (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <div style={{ marginBottom: 16, display: 'inline-flex' }}>
                      <SpinnerIcon size={40} />
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>
                      Converting to 300 DPI images…
                    </p>
                    <p style={{ color: '#6366f1', fontSize: 12, marginTop: 6 }}>
                      scale: 4.17× (72 × 4.17 = 300 DPI)
                    </p>
                  </div>
                ) : (
                  <div
                    style={s.dropzone(dragging)}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current.click()}
                  >
                    <div style={s.dropIcon}>
                      {pages.length ? <FileIcon /> : <UploadIcon />}
                    </div>
                    {fileName ? (
                      <>
                        <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 15, marginBottom: 4 }}>
                          {fileName}
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: 13 }}>
                          Click or drop to replace
                        </p>
                      </>
                    ) : (
                      <>
                        <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 15, marginBottom: 8 }}>
                          Drop your PDF here
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: 13 }}>
                          or click to browse files
                        </p>
                        <span style={{ ...s.badge('blue'), marginTop: 14, display: 'inline-flex' }}>
                          PDF files only · Any size
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Page Previews */}
            {pages.length > 0 && (
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <FileIcon />
                  <span style={s.cardTitle}>Page Previews</span>
                  <span style={{ ...s.badge('blue'), marginLeft: 'auto' }}>300 DPI</span>
                </div>
                <div style={s.cardBody}>
                  <div style={s.pageGrid}>
                    {pages.map(page => (
                      <div
                        key={page.index}
                        style={s.pageThumb(selectedPage === page.index)}
                        onClick={() => setSelectedPage(selectedPage === page.index ? null : page.index)}
                      >
                        <img src={page.dataUrl} alt={`Page ${page.index}`} style={s.pageImg} />
                        <div style={s.pageLabel}>
                          <span>Page {page.index}</span>
                          <span style={{ color: '#94a3b8' }}>
                            {(page.size / 1024).toFixed(0)}KB
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Print Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={s.card}>
              <div style={s.cardHeader}>
                <PrintIcon />
                <span style={s.cardTitle}>Print Settings</span>
              </div>
              <div style={{ ...s.cardBody, display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Printer URI */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ ...s.label, marginBottom: 0, flex: 1 }}>Printer</label>
                    <button onClick={() => setShowHowToFind(v => !v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                        color: '#6366f1', fontSize: 11, fontWeight: 600, padding: '2px 6px' }}>
                      {showHowToFind ? '▲ Hide help' : '❓ How to find the address'}
                    </button>
                  </div>

                  {/* How-to-find collapsible */}
                  {showHowToFind && (
                    <div style={{ background: '#0f1117', border: '1px solid #2e3350',
                      borderRadius: 10, padding: '12px 14px', marginBottom: 10, fontSize: 11 }}>
                      <p style={{ color: '#818cf8', fontWeight: 700, marginBottom: 8 }}>
                        🔍 Finding your printer's IPP address
                      </p>
                      {[
                        { os: '🍎 macOS', cmd: 'lpstat -v', note: 'Look for ipp:// lines — copy the URI directly.' },
                        { os: '🐧 Linux', cmd: 'lpstat -v', note: 'Same as macOS.' },
                        { os: '🪟 Windows', cmd: 'Get-Printer | Get-PrinterPort | Select Name,PrinterHostAddress', note: 'Run in PowerShell. Use the IP to build: ipp://<IP>:631/ipp/print' },
                        { os: '🌐 Any (browser)', cmd: null, note: 'Go to your printer\'s web interface (type its IP in browser). Look under Settings → Network → IPP.' },
                      ].map(({ os, cmd, note }) => (
                        <div key={os} style={{ marginBottom: 8, paddingBottom: 8,
                          borderBottom: '1px solid #2e3350' }}>
                          <div style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 3 }}>{os}</div>
                          {cmd && (
                            <code style={{ display: 'block', background: '#1a1d27', color: '#22c55e',
                              padding: '4px 8px', borderRadius: 6, marginBottom: 3,
                              fontFamily: 'monospace', fontSize: 10, wordBreak: 'break-all' }}>
                              {cmd}
                            </code>
                          )}
                          <div style={{ color: '#64748b' }}>{note}</div>
                        </div>
                      ))}
                      <p style={{ color: '#64748b', marginTop: 4 }}>
                        URI format: <code style={{ color: '#818cf8' }}>ipp://192.168.1.x:631/ipp/print</code>
                      </p>
                    </div>
                  )}

                  {/* Combined auto-discovered + saved printer list */}
                  {(() => {
                    const allPrinters = [
                      ...savedPrinters.map(p => ({ ...p, saved: true })),
                      ...printers
                        .filter(p => !savedPrinters.some(s => s.uri === p.uri))
                        .map(p => ({ ...p, saved: false })),
                    ];
                    return allPrinters.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                        {allPrinters.map(p => (
                          <div key={p.uri} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: printerUri === p.uri ? 'rgba(99,102,241,0.15)' : '#22263a',
                            border: `1px solid ${printerUri === p.uri ? '#6366f1' : '#2e3350'}`,
                            borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                            transition: 'all 0.15s',
                          }} onClick={() => setPrinterUri(p.uri)}>
                            <span style={{ fontSize: 14 }}>{p.saved ? '💾' : '🔍'}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.name}
                              </div>
                              <div style={{ fontSize: 10, color: '#64748b',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.uri}
                              </div>
                            </div>
                            {printerUri === p.uri && <CheckIcon />}
                            {p.saved && (
                              <button onClick={e => { e.stopPropagation(); deleteSavedPrinter(p.uri); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer',
                                  color: '#ef4444', padding: '2px 4px', fontSize: 14 }}
                                title="Remove saved printer">✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}

                  {/* Add / type custom URI */}
                  {!showAddPrinter ? (
                    <button onClick={() => setShowAddPrinter(true)}
                      style={{ ...s.btn('ghost'), padding: '8px 14px', fontSize: 12 }}>
                      ＋ Add printer manually
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6,
                      background: '#0f1117', border: '1px solid #2e3350',
                      borderRadius: 10, padding: 12 }}>
                      <input style={{ ...s.input, fontSize: 12 }}
                        placeholder="Name (e.g. HP LaserJet Office)"
                        value={newPrinterName}
                        onChange={e => setNewPrinterName(e.target.value)} />
                      <input style={{ ...s.input, fontSize: 12 }}
                        placeholder="ipp://192.168.1.x:631/ipp/print"
                        value={newPrinterUri}
                        onChange={e => setNewPrinterUri(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            if (savePrinter(newPrinterUri, newPrinterName)) {
                              setNewPrinterUri(''); setNewPrinterName(''); setShowAddPrinter(false);
                              showToast('✓ Printer saved!', 'success');
                            }
                          }
                        }} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...s.btn('primary'), padding: '8px 14px', fontSize: 12 }}
                          onClick={() => {
                            if (savePrinter(newPrinterUri, newPrinterName)) {
                              setNewPrinterUri(''); setNewPrinterName(''); setShowAddPrinter(false);
                              showToast('✓ Printer saved!', 'success');
                            }
                          }}>
                          💾 Save
                        </button>
                        <button style={{ ...s.btn('ghost'), padding: '8px 14px', fontSize: 12 }}
                          onClick={() => { setShowAddPrinter(false); setNewPrinterUri(''); setNewPrinterName(''); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Name */}
                <div>
                  <label style={s.label}>Job Name</label>
                  <input style={s.input} value={jobName}
                    onChange={e => setJobName(e.target.value)}
                    placeholder="My Print Job" />
                </div>

                {/* Page Range */}
                <div>
                  <label style={s.label}>
                    Page Range
                    {pages.length > 0 && (
                      <span style={{ color: '#64748b', marginLeft: 6, fontWeight: 400, textTransform: 'none' }}>
                        (1–{pages.length})
                      </span>
                    )}
                  </label>
                  <input style={s.input} value={pageRange}
                    onChange={e => setPageRange(e.target.value)}
                    placeholder={`All pages${pages.length ? ` (1–${pages.length})` : ''} — e.g. 1-2, 4`} />
                  <p style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                    Leave blank for all · e.g. <code style={{color:'#818cf8'}}>1-3, 5, 7-9</code>
                  </p>
                </div>

                {/* Copies + Color Mode row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={s.label}>Copies</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => setCopies(c => Math.max(1, c - 1))}
                        style={{ ...s.btn('ghost'), width: 36, padding: 0, flexShrink: 0 }}>−</button>
                      <input style={{ ...s.input, textAlign: 'center', padding: '10px 4px' }}
                        type="number" min="1" max="99" value={copies}
                        onChange={e => setCopies(Math.max(1, parseInt(e.target.value) || 1))} />
                      <button onClick={() => setCopies(c => Math.min(99, c + 1))}
                        style={{ ...s.btn('ghost'), width: 36, padding: 0, flexShrink: 0 }}>+</button>
                    </div>
                  </div>
                  <div>
                    <label style={s.label}>Color</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['color', 'grayscale'].map(mode => (
                        <button key={mode}
                          onClick={() => setColorMode(mode)}
                          style={{
                            flex: 1, padding: '10px 4px', borderRadius: 8, border: 'none',
                            fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            background: colorMode === mode
                              ? 'linear-gradient(135deg,#6366f1,#818cf8)' : '#22263a',
                            color: colorMode === mode ? '#fff' : '#94a3b8',
                            transition: 'all 0.15s',
                          }}>
                          {mode === 'color' ? '🎨 Color' : '⬛ B&W'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Duplex / Double-sided */}
                <div>
                  <label style={s.label}>Sides</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      ['one-sided', '1️⃣ One'],
                      ['two-sided-long-edge', '📖 Long'],
                      ['two-sided-short-edge', '🔄 Short'],
                    ].map(([val, lbl]) => (
                      <button key={val}
                        onClick={() => setDuplex(val)}
                        style={{
                          flex: 1, padding: '10px 4px', borderRadius: 8, border: 'none',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          background: duplex === val
                            ? 'linear-gradient(135deg,#6366f1,#818cf8)' : '#22263a',
                          color: duplex === val ? '#fff' : '#94a3b8',
                          transition: 'all 0.15s',
                        }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <p style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                    {duplex === 'one-sided' ? 'Single-sided printing'
                      : duplex === 'two-sided-long-edge' ? 'Double-sided: flip on long edge (book)'
                      : 'Double-sided: flip on short edge (calendar)'}
                  </p>
                </div>

                {/* Pipeline info */}
                <div style={{ background: '#22263a', borderRadius: 10, padding: '12px 14px',
                  border: '1px solid #2e3350', fontSize: 11 }}>
                  <p style={{ color: '#94a3b8', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>
                    PIPELINE
                  </p>
                  {[
                    ['PDF → PNG', 'pdfjs-dist · scale ×4.17 · 300 DPI'],
                    ['PNG → PWG', `bitmap-to-pwg · ${colorMode === 'grayscale' ? 'grayscale' : 'RGB'} · lossless`],
                    ['PWG → Printer', `IPP · single job · ${duplex === 'one-sided' ? '1-sided' : '2-sided'}`],
                  ].map(([a, b]) => (
                    <div key={a} style={{ display: 'flex', justifyContent: 'space-between',
                      padding: '3px 0', borderBottom: '1px solid #2e3350', gap: 8 }}>
                      <span style={{ color: '#f1f5f9', fontWeight: 600, whiteSpace: 'nowrap' }}>{a}</span>
                      <span style={{ color: '#64748b', textAlign: 'right' }}>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Encoding progress */}
                {printing && encodingProgress.total > 0 && encodingProgress.done < encodingProgress.total && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                      <span style={{ animation: 'pulse 1.5s infinite' }}>
                        ⚙️ Encoding PWG raster… {encodingProgress.done}/{encodingProgress.total}
                      </span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                        {Math.round(encodingProgress.done / encodingProgress.total * 100)}%
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: '#22263a', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, transition: 'width 0.3s',
                        width: `${Math.round(encodingProgress.done / encodingProgress.total * 100)}%`,
                        background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
                    </div>
                  </div>
                )}

                {/* Send progress */}
                {printing && printProgress.copy > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                      <span style={{ animation: 'pulse 1.5s infinite' }}>
                        🖨️ {printProgress.status === 'done'
                          ? `Copy ${printProgress.copy}/${printProgress.copies} sent`
                          : `Sending copy ${printProgress.copy}/${printProgress.copies}…`}
                        {printProgress.totalPages > 0 && ` · ${printProgress.totalPages} pages`}
                        {printProgress.sizeKB > 0 && ` · ${(printProgress.sizeKB / 1024).toFixed(1)} MB`}
                      </span>
                      <span style={{ color: '#6366f1', fontWeight: 700 }}>
                        {Math.round((printProgress.status === 'done' ? printProgress.copy : printProgress.copy - 0.5) / printProgress.copies * 100)}%
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: '#22263a', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, transition: 'width 0.3s',
                        width: `${Math.round((printProgress.status === 'done' ? printProgress.copy : printProgress.copy - 0.5) / printProgress.copies * 100)}%`,
                        background: 'linear-gradient(90deg,#6366f1,#818cf8)' }} />
                    </div>
                    {printProgress.status === 'done' && printProgress.copy < printProgress.copies && (
                      <p style={{ color: '#64748b', fontSize: 11, marginTop: 6, textAlign: 'center' }}>
                        Waiting before next copy…
                      </p>
                    )}
                  </div>
                )}

                {printDone && (
                  <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: 10, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    color: '#22c55e', fontSize: 13, fontWeight: 600 }}>
                    <CheckIcon /> Print job complete!
                  </div>
                )}

                {/* Print Button → opens preview */}
                <button
                  style={s.btn('primary', !pages.length || !printerUri || printing || converting)}
                  disabled={!pages.length || !printerUri || printing || converting}
                  onClick={() => setShowPreview(true)}
                >
                  {printing
                    ? <><SpinnerIcon /> {encodingProgress.done < encodingProgress.total ? 'Encoding…' : 'Printing…'}</>
                    : <><EyeIcon /> Preview &amp; Print
                        {pages.length > 0 && ` · ${pageRange
                          ? `pages ${pageRange}`
                          : `${pages.length} page${pages.length > 1 ? 's' : ''}`
                        }${copies > 1 ? ` × ${copies}` : ''}`}
                      </>}
                </button>

                {/* Clear */}
                {pages.length > 0 && !printing && (
                  <button style={s.btn('danger')}
                    onClick={() => { setPages([]); setFileName(''); setPrintDone(false); setJobId(null); setPageRange(''); }}>
                    <TrashIcon /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            {pages.length > 0 && (
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <span style={s.cardTitle}>Job Info</span>
                </div>
                <div style={{ ...s.cardBody, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['File', fileName],
                    ['Pages', pages.length],
                    ['Resolution', '300 DPI'],
                    ['Format', 'PNG → IPP'],
                    ['Total size', (pages.reduce((a, p) => a + p.size, 0) / 1024 / 1024).toFixed(1) + ' MB'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                      fontSize: 13, padding: '6px 0', borderBottom: '1px solid #22263a' }}>
                      <span style={{ color: '#94a3b8' }}>{k}</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 600,
                        maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', textAlign: 'right' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Print Preview Modal ─────────────────────────────────────── */}
      {showPreview && (() => {
        const previewPages = parsePageRangeFn(pageRange, pages.length)
          .map(n => pages.find(p => p.index === n))
          .filter(Boolean);

        const duplexLabel = duplex === 'one-sided' ? 'One-sided'
          : duplex === 'two-sided-long-edge' ? 'Duplex — Long edge (book)'
          : 'Duplex — Short edge (calendar)';

        // Heuristic: warn about suspiciously dark pages (solid-black covers)
        // We sample the thumbnail's average luminance via a canvas.
        // This is done lazily in the component via data attrs set below.
        const printerLabel = printers.find(p => p.uri === printerUri)?.name || printerUri;

        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.2s ease',
          }}
            onKeyDown={e => e.key === 'Escape' && setShowPreview(false)}
            tabIndex={-1}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '18px 28px', borderBottom: '1px solid #2e3350',
              background: 'rgba(26,29,39,0.95)', flexShrink: 0,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg,#6366f1,#818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <EyeIcon />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>
                  Print Preview
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {previewPages.length} page{previewPages.length !== 1 ? 's' : ''} will be sent
                  &nbsp;·&nbsp;Previews shown at reduced resolution (actual print: 300 DPI)
                </div>
              </div>
              <button onClick={() => setShowPreview(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 8 }}>
                <XIcon />
              </button>
            </div>

            {/* Settings bar */}
            <div style={{
              display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
              padding: '12px 28px', borderBottom: '1px solid #2e3350',
              background: 'rgba(26,29,39,0.75)', flexShrink: 0,
            }}>
              {[
                ['🖨️', printerLabel],
                ['📄', `${previewPages.length} page${previewPages.length !== 1 ? 's' : ''}`],
                ['🔁', `${copies} cop${copies !== 1 ? 'ies' : 'y'}`],
                ['🎨', colorMode === 'color' ? 'Color' : 'Grayscale (B&W)'],
                ['📐', duplexLabel],
                ['📌', jobName],
              ].map(([icon, val]) => (
                <span key={val} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: '#22263a', border: '1px solid #2e3350',
                  borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#f1f5f9',
                }}>
                  {icon} {val}
                </span>
              ))}
            </div>

            {/* Page grid */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 20, alignContent: 'start',
            }}>
              {previewPages.map((page, idx) => (
                <PreviewPageCard key={page.index} page={page} idx={idx}
                  colorMode={colorMode} />
              ))}
            </div>

            {/* Footer CTA */}
            <div style={{
              display: 'flex', gap: 12, padding: '18px 28px',
              borderTop: '1px solid #2e3350',
              background: 'rgba(26,29,39,0.95)', flexShrink: 0,
              justifyContent: 'flex-end',
            }}>
              <button onClick={() => setShowPreview(false)}
                style={{ ...s.btn('ghost'), width: 'auto', padding: '12px 28px' }}>
                Cancel
              </button>
              <button
                style={{ ...s.btn('primary'), width: 'auto', padding: '12px 36px',
                  fontSize: 15 }}
                onClick={() => { setShowPreview(false); handlePrint(); }}
              >
                <PrintIcon /> Confirm &amp; Print
              </button>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div style={s.toast(toast.type)}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
