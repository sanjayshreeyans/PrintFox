# 🦊 PrintFox

> *Clever PDF printing — no drivers, no system tools, no permission needed.*

A full-stack web application for converting and printing PDF documents directly to network printers via IPP (Internet Printing Protocol), bypassing system print drivers. Built specifically to work on locked-down environments (like school Macs) where system tools like `lp` or `pdf-poppler` are unavailable or broken.

## Features

- **Pure JavaScript Pipeline**: No external system dependencies (no Homebrew, no Poppler, no Ghostscript).
- **High-Quality Output**: Converts PDFs to 300 DPI images using `pdfjs-dist`.
- **Direct IPP Printing**: Communicates directly with network printers using the `ipp` protocol.
- **PWG Raster Support**: Encodes images to PWG Raster format (`bitmap-to-pwg`), widely supported by modern printers (e.g., HP).
- **Saved Printers**: Manually added printers are stored in `localStorage` and persist across sessions.
- **Print Preview**: See exactly what will be sent before confirming, with dark-page warnings.
- **Advanced Print Controls**:
  - Page range selection
  - Multiple copies
  - Color or Grayscale (B&W) modes
  - Duplex printing (One-sided, Long-edge, Short-edge)
- **Fast Multi-page Printing**: Concatenates all pages into a single PWG stream — no per-page delays.
- **Works on Locked-Down Macs**: Uses `ippfind` (CUPS-bundled) for printer discovery — no system printer configuration needed.
- **Modern React UI**: Drag-and-drop upload, page previews, real-time progress tracking.

## Finding Your Printer's IPP Address

PrintFox auto-discovers printers on startup using `ippfind` (bundled with CUPS on macOS 10.11+ and most Linux distros). You can also run it yourself in a terminal to verify:

```bash
ippfind -s -p
```

Example output:

```text
HP Smart Tank 6000 series [E77C3F]
ipp://HP7C4D8FE77C3F.local:631/ipp/print
```

Copy the `ipp://` line directly into the **Add printer manually** form if auto-discovery doesn't pick it up.

> **Why not `lpstat -v`?** On locked-down school/work Macs, `lpstat` returns *"No destinations added"* because you can't add system printers — but `ippfind` scans the network directly via mDNS/Bonjour and works without any system printer configuration.

### Fallback: Printer web interface

Type your printer's IP address into a browser and look under **Settings → Network → IPP** for the URI path.

URI format: `ipp://<printer-ip>:631/ipp/print`

## Architecture

The application consists of two parts:

1. **Express Backend (`server.js`)**:
   - Handles PDF uploads and stores them temporarily in `uploads/`.
   - Converts PDFs to high-resolution PNGs using `pdf-to-img` (based on `pdfjs-dist`).
   - Auto-discovers local printers via `ippfind -s -p` (CUPS-bundled, works on locked-down Macs); falls back to `lpstat -v`.
   - Processes print jobs: reads PNGs with `sharp`, encodes to PWG Raster, concatenates, sends via IPP.
   - Streams progress back to the client using Server-Sent Events (SSE).
   - Detects near-black pages (mean luma < 10) and emits a warning before sending.

2. **React Frontend (`client/`)**:
   - Built with Vite and React 19.
   - Saved printers stored in `localStorage` under `printfox_printers`.
   - Auto-discovered printers merged with saved ones in the printer picker.
   - Print Preview modal: shows filtered pages with live B&W filter, dark-page warnings, settings summary.
   - Communicates with the backend via REST + SSE for real-time progress.

## Prerequisites

- Node.js (v18 or higher recommended)
- A network printer supporting IPP and PWG Raster format.

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd print-tool
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Usage

### Development Mode

Run both the backend server and the Vite frontend development server concurrently:

```bash
npm run dev
```

- The frontend will be available at `http://localhost:5173`.
- The backend API will run on `http://localhost:3001`.

### Production Mode

1. Build the frontend:

   ```bash
   npm run build
   ```

2. Start the production server:

   ```bash
   npm start
   ```

   The server will serve the built frontend files and the API on `http://localhost:3001`.

## Project Structure

```text
print-tool/
├── client/                 # React frontend source code
│   ├── index.html          # HTML entry point
│   └── src/
│       ├── App.jsx         # Main React component (UI + preview modal)
│       ├── main.jsx        # React entry point
│       └── index.css       # Global styles
├── uploads/                # Temporary storage for uploaded PDFs and converted images
├── server.js               # Express backend server
├── package.json            # Project metadata and dependencies
├── vite.config.js          # Vite configuration
└── .gitignore              # Git ignore rules
```

## How the Printing Pipeline Works

1. **Upload**: PDF is uploaded to the server via drag-and-drop.
2. **Convert**: `pdf-to-img` converts the PDF to 300 DPI PNGs saved on disk; low-res thumbnails are sent to the browser.
3. **Preview**: Clicking **Preview & Print** opens a full-screen modal showing exactly which pages will be sent, filtered by your page range, with a grayscale CSS filter applied if B&W is selected. Pages that appear nearly black trigger a `⚠️ Page looks very dark` warning banner.
4. **Confirm**: Clicking **Confirm & Print** sends the job.
5. **Encode**: Server reads the selected PNGs, flattens alpha → white via `sharp`, runs a blank-page luminance check (warns if mean luma < 10/255), then encodes pixels to PWG Raster with `bitmap-to-pwg`. Grayscale uses BT.601 luma (0.299R + 0.587G + 0.114B) computed per-pixel while keeping 3-channel RGB for the encoder.
6. **Concatenate**: Strips the `RaS2` sync word from pages 2+ and concatenates all pages into one buffer.
7. **Print**: Sent as a single `Print-Job` IPP operation with the `sides` attribute for duplex, streaming real-time progress back via SSE.

## Troubleshooting

- **Printer rejects job**: Ensure the printer supports `image/pwg-raster`. You can query supported formats using an IPP tool.
- **Black pages**: The tool forces RGB encoding and calculates grayscale manually. The server also logs a warning to the UI if it detects a near-black page before it hits the printer.
- **Slow printing**: All pages are concatenated into a single IPP job for maximum speed. If it's still slow, check network connectivity to the printer.

## License

MIT
