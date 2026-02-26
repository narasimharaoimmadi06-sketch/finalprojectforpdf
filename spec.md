# Specification

## Summary
**Goal:** Build ConvertHub, a fully client-side, all-in-one file conversion web app with a premium dark glassmorphism UI.

**Planned changes:**
- Hero section with "ConvertHub" name, tagline, animated logo mark, and Google Fonts (Inter or Poppins)
- Dark glassmorphism theme with animated purple/blue gradient background, floating particles, glass-effect cards, and neon glow on active elements
- Responsive tool grid (4 columns desktop / 2 tablet / 1 mobile) with 8 tool cards, each having a unique gradient icon, name, description, and smooth hover animations
- Each tool card opens a modal with drag-and-drop upload zone (animated border), file input fallback, conversion options, gradient progress bar, download button, and toast notifications
- PDF to Image tool: render PDF pages to JPG/PNG using PDF.js (CDN)
- Image to PDF tool: combine images into a PDF using jsPDF (CDN)
- Image to Word tool: embed image(s) into a DOCX file using a client-side docx library
- PDF to Word tool: extract text via PDF.js and generate DOCX client-side
- Word to PDF tool: parse DOCX with Mammoth.js (CDN) and export PDF via jsPDF
- Image Compressor tool: re-encode image at user-selected quality using Canvas API, show original vs compressed size
- Image Resizer tool: resize image to custom dimensions with aspect-ratio lock using Canvas API, show preview
- Merge PDFs tool: upload multiple PDFs, reorder them, merge into one using pdf-lib (CDN)
- Footer with app name, brief description, and privacy-first "all processing is local" messaging
- All processing entirely client-side; no backend file logic

**User-visible outcome:** Users can visit ConvertHub and instantly convert, compress, resize, or merge files directly in the browser across 8 tools — no uploads, no account, no waiting.
