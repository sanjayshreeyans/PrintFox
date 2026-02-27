# PDF Print Tool

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

```
print-tool/
├── client/                 # React frontend source code
│   ├── index.html          # HTML entry point
│   └── src/
│       ├── App.jsx         # Main React component
│       ├── main.jsx        # React entry point
│       └── index.css       # Global styles
├── uploads/                # Temporary storage for uploaded PDFs and converted images
├── server.js               # Express backend server
├── package.json            # Project metadata and dependencies
├── vite.config.js          # Vite configuration
└── .gitignore              # Git ignore rules
```

## How the Printing Pipeline Works

1. **Upload**: PDF is uploaded to the server.
2. **Convert**: `pdf-to-img` converts the PDF to 300 DPI PNGs (saved to disk to avoid memory issues) and generates low-res data URIs for frontend previews.
3. **Configure**: User selects print settings (printer, range, copies, color, duplex) on the frontend.
4. **Process**:
   - Server reads the selected PNGs.
   - `sharp` flattens the image (removes alpha channel, sets white background).
   - If Grayscale is selected, a custom luma calculation (BT.601) is applied to the RGB pixels.
   - `bitmap-to-pwg` encodes the raw pixels into PWG Raster format.
5. **Concatenate**: The server strips the "RaS2" sync word from subsequent pages and concatenates all pages into a single buffer.
6. **Print**: The buffer is sent as a single `Print-Job` operation via IPP, including job attributes like `sides` for duplex printing.

## Troubleshooting

- **Printer rejects job**: Ensure the printer supports `image/pwg-raster`. You can query supported formats using an IPP tool.
- **Black pages**: This can happen if the color space encoding is incorrect. The tool forces RGB encoding and calculates grayscale manually to avoid issues with printers expecting 3-byte pixels.
- **Slow printing**: The tool concatenates pages into a single job to maximize speed. If it's still slow, check network connectivity to the printer.

## License

MIT
