# 🥷 PrintNinja

> *Stealth PDF printing — no drivers, no system tools, no permission needed.*

A full-stack web application for converting and printing PDF documents directly to network printers via IPP (Internet Printing Protocol), bypassing system print drivers. Built specifically to work on locked-down environments (like school Macs) where system tools like `lp` or `pdf-poppler` are unavailable or broken.

## Features

- **Pure JavaScript Pipeline**: No external system dependencies (no Homebrew, no Poppler, no Ghostscript).
- **High-Quality Output**: Converts PDFs to 300 DPI images using `pdfjs-dist`.
- **Direct IPP Printing**: Communicates directly with network printers using the `ipp` protocol.
- **PWG Raster Support**: Encodes images to PWG Raster format (`bitmap-to-pwg`), widely supported by modern printers (e.g., HP).
- **Advanced Print Controls**:
  - Page range selection
  - Multiple copies
  - Color or Grayscale (B&W) modes
  - Duplex printing (One-sided, Long-edge, Short-edge)
- **Fast Multi-page Printing**: Concatenates all pages into a single PWG stream for fast, continuous printing without per-page delays.
- **Modern React UI**: Drag-and-drop upload, page previews, and real-time progress tracking.

## Architecture

The application consists of two main parts:

1. **Express Backend (`server.js`)**:
   - Handles PDF uploads and stores them temporarily in `uploads/`.
   - Converts PDFs to high-resolution PNGs using `pdf-to-img` (based on `pdfjs-dist`).
   - Discovers local printers using `lpstat` (if available) or accepts custom IPP URIs.
   - Processes print jobs:
     - Reads PNGs and processes them with `sharp` (flattening, grayscale conversion).
     - Encodes pixels to PWG Raster format.
     - Concatenates pages into a single stream.
     - Sends the job to the printer via IPP.
   - Streams progress back to the client using Server-Sent Events (SSE).

2. **React Frontend (`client/`)**:
   - Built with Vite and React.
   - Provides a user-friendly interface for uploading PDFs and configuring print settings.
   - Displays low-resolution previews of the PDF pages.
   - Communicates with the backend via REST APIs and listens to SSE for real-time print progress.

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
