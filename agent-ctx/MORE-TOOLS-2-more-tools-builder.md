# Task ID: MORE-TOOLS-2 — 12 New Client-Side Tools Builder

**Agent:** MORE-TOOLS-2 (Z.ai Code)
**Task:** Build 12 new 100% client-side tools and register them in tools-registry & tool-loader.

## Files Created (12)
1. `/src/components/tools/csv-to-json.tsx` — CSV→JSON with RFC-4180 parser, delimiter auto-detect (comma/semicolon/tab/pipe), header toggle, trim, type inference.
2. `/src/components/tools/text-escape-unescape.tsx` — 6 tabs (HTML/URL/JSON/SQL/Regex/Shell) escape + unescape with quick-reference cheat sheet.
3. `/src/components/tools/base64-to-file.tsx` — Base64→file with data: prefix stripping, magic-byte signature detection (PNG/JPG/GIF/WebP/PDF/ZIP/GZIP/MP3/WAV/MP4/BMP/ICO/SVG), 256-byte hex view.
4. `/src/components/tools/image-to-ascii.tsx` — Image→ASCII with width 20-200, 4 charsets (standard/blocks/minimal/custom), invert, ANSI color codes.
5. `/src/components/tools/image-color-quantizer.tsx` — Color posterizer: 5-bit/channel histogram, top-N palette by popularity, nearest-neighbor remap with LUT cache.
6. `/src/components/tools/css-flexbox-playground.tsx` — Interactive flexbox builder with container+item controls, 6 preset layouts, live CSS output.
7. `/src/components/tools/border-radius-generator.tsx` — 4-corner sliders with linked toggle, 3 units (px/%/em), 8 preset shapes, live preview on checkerboard.
8. `/src/components/tools/color-contrast-checker.tsx` — WCAG contrast ratio with 4 pass/fail badges (AA/AAA × Normal/Large), live preview, swap, smart color suggestions.
9. `/src/components/tools/markdown-table-generator.tsx` — Visual table editor with editable cells, per-column alignment, reordering, live rendered preview.
10. `/src/components/tools/text-stats-analyzer.tsx` — Deep text stats: chars/words/sentences/paragraphs, reading+speaking time, Flesch Reading Ease + Grade Level with syllable counting, character breakdown bars.
11. `/src/components/tools/html-to-markdown.tsx` — DOMParser-based HTML→Markdown: h1-6, p, strong/em/del, a, img, code/pre, ul/ol/li (nested), blockquote, hr, table, checkbox.
12. `/src/components/tools/pdf-to-images.tsx` — PDF→PNG/JPEG using pdfjs-dist (worker copied to /public), per-page thumbnails, ZIP download via jszip, metadata extraction.

## Files Modified
- `/src/lib/tools-registry.ts` — Added 12 entries in PDF/IMAGE/TEXT/DEVELOPER blocks. Total: 109 → 121.
- `/src/components/tool-loader.tsx` — Added 12 `dyn(() => import(...))` entries.
- `/eslint.config.mjs` — Added `public/**` to ignores so pdf.worker.min.mjs doesn't trigger lint.
- `/public/pdf.worker.min.mjs` — Copied from pdfjs-dist/build for client-side worker.

## New Dependency
- `pdfjs-dist@6.3.289` (installed via `bun add pdfjs-dist`)

## Lint Status
- `bun run lint` → 0 errors, 0 warnings.

## HTTP Status Verification (all 200)
- csv-to-json, text-escape-unescape, base64-to-file, image-to-ascii, image-color-quantizer
- css-flexbox-playground, border-radius-generator, color-contrast-checker, markdown-table-generator
- text-stats-analyzer, html-to-markdown, pdf-to-images

## Issues Encountered & Fixed
1. `FileMarkdown` icon does not exist in lucide-react. Replaced with `FileText` in html-to-markdown.tsx.
2. Public folder files (pdf.worker.min.mjs) caused 1252 lint warnings/errors. Added `public/**` to eslint ignores.
3. Dev server was not running on first check; restarted via setsid.
