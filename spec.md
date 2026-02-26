# Specification

## Summary
**Goal:** Fix the blank white screen issue where the browser displays raw project metadata ("pdf-image-converter-toolkit" and Caffeine export description) instead of the ConvertHub React UI.

**Planned changes:**
- Audit and fix `index.html` to ensure the `<div id="root"></div>` element is present and the React bundle script tag is correctly referenced
- Ensure all CDN scripts (PDF.js, jsPDF, pdf-lib, Mammoth.js) are loaded before the React bundle, with PDF.js workerSrc set inline after its CDN script
- Verify `main.tsx` correctly calls `ReactDOM.createRoot` on the root element and renders the App component
- Add a visible fallback error message if the root element is not found in the DOM

**User-visible outcome:** Opening the app URL displays the full ConvertHub dark glassmorphism interface with the Hero section, 8 tool cards grid, and Footer — no more blank white page or raw project name text.
