# Specification

## Summary
**Goal:** Fix the white screen on load issue in the ConvertHub app by resolving runtime errors that prevent React from mounting.

**Planned changes:**
- Audit `App.tsx` and all tool components for runtime errors that block mounting
- Add null/undefined guards for CDN library globals (`pdfjsLib`, `jspdf`, `PDFLib`, `mammoth`) before use in tool components
- Wrap the app root in an error boundary to display a fallback UI on uncaught errors
- Audit `index.html` to ensure CDN script tags load in the correct order with appropriate attributes
- Verify PDF.js `workerSrc` is set to a matching CDN version after the PDF.js script loads
- Confirm all CDN URLs (PDF.js, jsPDF, pdf-lib, Mammoth.js) are valid and error-free

**User-visible outcome:** The app loads fully on first visit — showing the hero, all 8 tool cards, and the footer — with no white screen and no console errors.
