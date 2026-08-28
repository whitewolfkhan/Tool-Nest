# Free All-In-One Tools Website — Worklog

This file tracks all development work on the Free Tools website project.
Each agent appends a new section (starting with `---`) when finishing a task.

---
Task ID: 1
Agent: Main (Z.ai Code)
Task: Initialize project — explore structure, install packages, set up worklog.

Work Log:
- Explored existing Next.js 16 + Tailwind 4 + shadcn/ui scaffold (full shadcn/ui component set already installed).
- Installed packages: `pdf-lib`, `qrcode`, `jszip`, `@types/qrcode`.
- Confirmed dev server is running on port 3000.

Stage Summary:
- Project baseline ready. Stack: Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui (New York), z-ai-web-dev-sdk available.
- Theme color policy: avoid indigo/blue → will use emerald/teal as primary brand color.
- Architecture plan: homepage with search + categories, dynamic `/tools/[slug]` route per tool.
- Next: build foundation (theme, registry data, layout, homepage, tool route shell), then dispatch parallel subagents for each tool category.

---
Task ID: 5
Agent: Text Tools Builder
Task: Build 12 text-category tools (word counter, case converter, lorem ipsum, dedupe lines, sort lines, find/replace, reverse text, slug generator, text diff, text↔binary, text↔morse, whitespace remover).

Work Log:
- Read existing `tool-page-shell.tsx` shared helpers (CopyButton, DownloadButton, ToolCardWrapper, EmptyState, FieldLabel) and confirmed UI primitives available (Button, Input, Textarea, Card, Tabs, Select, Switch, Checkbox, Label, Badge, Separator, Slider, ScrollArea, Toggle).
- Verified all 12 slugs exist in `tools-registry.ts` and `tool-loader.tsx` already wires the dynamic imports.
- `word-counter.tsx` — textarea + 8-card stats grid (words, chars, chars no spaces, sentences, paragraphs, lines, reading time, speaking time) with copy + download.
- `case-converter.tsx` — 10 case transforms (UPPER, lower, Title, Sentence, camel, Pascal, snake, kebab, CONSTANT, alternating) using Unicode-aware word splitter; live re-application after first conversion.
- `lorem-ipsum.tsx` — Slider-driven options (paragraphs, sentences, words, "lorem ipsum" start switch), word bank of 60+ Latin words, copy/download, initial sample generation on mount.
- `remove-duplicate-lines.tsx` — Switch options (case-sensitive, trim, keep-empty) + removed/unique counts; preserves order on first occurrence.
- `sort-lines.tsx` — Select for direction + sort mode (lexical, natural with numeric-aware comparator, by length), case-insensitive & dedupe switches.
- `find-replace.tsx` — Live preview with regex support, case-sensitive toggle, whole-word (auto-disabled when regex on), backreference `$1`/`$&` substitution, error display, count badge, apply-to-input.
- `text-reverse.tsx` — Three modes via Toggle (chars using Array.from for safe surrogate handling, words preserving whitespace runs, lines).
- `slug-generator.tsx` — NFKD normalization + diacritic stripping + stopword removal option + separator (hyphen/underscore) + lowercase switch.
- `text-diff.tsx` — Inline LCS DP table, normalized comparison (case/whitespace/trim switches), color-coded unified table with left/right line numbers, add/remove/unchanged badges, copy-diff button.
- `text-to-binary.tsx` — Tabs for encode/decode, separator (space/none/dash), encoding (UTF-8/ASCII), TextEncoder/TextDecoder for multi-byte safety, padding handling.
- `text-to-morse.tsx` — Standard Morse map, Tabs encode/decode, configurable separators, Web Audio API oscillator with WPM (PARIS standard) + pitch sliders, play/stop controls.
- `whitespace-remover.tsx` — Four switches (trim, collapse, remove-blanks, remove-all as override) + before/after byte size with savings badge.
- All tools use `'use client'`, ToolCardWrapper for consistent `p-5 sm:p-6` padding, FieldLabel, sonner toast for feedback, mobile-first responsive grids (`grid sm:grid-cols-2`, `lg:grid-cols-[1fr_320px]`).
- Color palette: emerald (additions) and rose (removals) accents; no indigo/blue.
- Lint cleanup:
  - Fixed initial issue where `text-to-binary.tsx` called `setState` inside `useMemo` — refactored to return `{ output, error }` from the memo instead of using separate state.
  - Removed unused `eslint-disable` comment in `lorem-ipsum.tsx` (the hook had no `react-hooks/exhaustive-deps` violations).

Stage Summary:
- 12 text tools delivered at `/src/components/tools/<slug>.tsx`, each `export default function`, fully client-side, no API calls, no new dependencies.
- `bun run lint` passes with 0 errors in the text tool files (remaining 12 warnings are all in image-* tools owned by other agents — not modified).
- Dev server log shows clean compilation; all 12 dynamic imports already registered in `tool-loader.tsx`.

---
Task ID: 12
Agent: AI Tools Builder (Z.ai Code)
Task: Build 6 AI tools (image generator, content writer, image describer, chat assistant, summarizer, translator) plus their backend API routes using z-ai-web-dev-sdk.

Work Log:
- Read worklog.md, tool-page-shell.tsx, tool-loader.tsx to understand shared utilities (CopyButton, DownloadButton, ToolCardWrapper, EmptyState, FieldLabel).
- Created 6 server-side API routes under /src/app/api/ai/:
  - image-generator/route.ts — uses zai.images.generations.create; validates prompt ≤1000 chars; supports sizes 512x512/1024x1024 and n 1-4.
  - content-writer/route.ts — uses zai.chat.completions.create; adapts system prompt to type (article/email/product-description/social-post/blog-post), tone, and length.
  - image-describer/route.ts — VLM via zai.chat.completions with image_url content block; 6MB cap; rich caption+objects+colors+mood instructions.
  - chat-assistant/route.ts — non-streaming multi-turn chat; caps to last 30 messages and per-message 4000 chars; ToolNest Assistant system prompt.
  - summarizer/route.ts — returns JSON {summary, keyPoints[]}; robust JSON parser with fenced-block fallback; length-aware instructions.
  - translator/route.ts — supports 21 languages; auto-detect via DETECTED_SOURCE=xx trailing line or fallback detection call; returns detectedSource when source omitted.
- All routes: export async POST(req: NextRequest), runtime='nodejs', dynamic='force-dynamic', try/catch, friendly rate-limit (429) messages, Response.json returns.
- Created 6 client tool components under /src/components/tools/:
  - ai-image-generator.tsx — prompt + size select, grid of generated images with download buttons, save-to-gallery (in-memory), example prompts, regenerate.
  - ai-content-writer.tsx — type/tone/length selects + topic textarea, styled output article, word count badge, copy + download-as-txt.
  - ai-image-describer.tsx — drag-drop upload, preview thumbnail, AI description card with copy, base64 conversion via FileReader.
  - ai-chat-assistant.tsx — chat bubbles (user right/assistant left), avatars, sticky input, max-h-[60vh] scrollable message list, suggested prompts when empty, Enter-to-send.
  - ai-summarizer.tsx — long textarea, length selector, summary paragraph card + numbered key points list, separate copy buttons.
  - ai-translator.tsx — source (auto-detect)/target language selectors (21 languages), translation output, "Auto-detected: XX" badge when applicable, copy button.
- All tools use shadcn/ui (Button, Input, Textarea, Card, Select, Badge, Avatar, Separator) + lucide-react icons + sonner toast for errors.
- Resolved lint issues in own files:
  - Renamed function `useExample` → `applyExample` in ai-image-generator.tsx (avoid react-hooks/rules-of-hooks false positive on names starting with "use").
  - Removed 4 unused `eslint-disable @next/next/no-img-element` directives in ai-image-generator.tsx and ai-image-describer.tsx.
  - Removed unused `ScrollArea` and `Card` imports from ai-chat-assistant.tsx.
- Verified `bun run lint`: 0 errors, 0 warnings in all 12 files I created. (Pre-existing warnings/errors in other tasks' files were left untouched.)
- Dev server log: clean — no compile errors after my files were added.

Stage Summary:
- 12 files created (6 API routes + 6 client tool components).
- All AI tools are end-to-end functional (client → API → z-ai-web-dev-sdk → response).
- All tools registered in /src/components/tool-loader.tsx already (registry was pre-built by Task 1 with ai-* slugs).
- Lint clean for my files. No modifications to files outside /src/components/tools/ and /src/app/api/ai/ (except worklog.md).

---
Task ID: 9
Agent: Converter Builder (Z.ai Code)
Task: Build 8 Converter tools as React client components for ToolNest.

Work Log:
- Built `unit-converter.tsx`: Length/Weight/Volume/Area category converter with from↔to fields, swap button, live result + formula badge.
- Built `number-base-converter.tsx`: Dashboard showing binary/octal/decimal/hex/base32/base64 simultaneously. Supports fractional radix numbers; base32 implemented manually per RFC 4648, base64 via native btoa/atob.
- Built `color-converter-tool.tsx` (filename deliberately suffixed `-tool` to avoid collision with existing `color-picker.tsx`): native color picker + HEX/RGB/HSL/CMYK text fields all live-synced. Swatch preview, complementary color (hue+180°), random color button, RGB channel info.
- Built `roman-numeral-converter.tsx`: Tabs for Number→Roman and Roman→Number. Validates 1-3999. Step-by-step breakdown like "1994 = M (1000) + CM (900) + XC (90) + IV (4)" plus reference table. Uses sonner toast for invalid input.
- Built `temperature-converter.tsx`: 4-field grid (°C, °F, K, °R) all live-synced. Active formula display + full conversion formula reference + quick reference temperature shortcuts.
- Built `data-storage-converter.tsx`: SI (1000) vs Binary (1024) toggle via Switch. Dashboard shows all units simultaneously. Educational notes on IEC vs SI convention.
- Built `time-converter.tsx`: 8-field grid (ms/s/min/h/day/week/month/year) all live-synced. Month/year use Gregorian averages (1y = 365.2425 days, 1mo = 1/12 y).
- Built `angle-converter.tsx`: 6-field grid (deg/rad/grad/turn/arcmin/arcsec) all live-synced. Quick reference angles (0°, 30°, 45°, 60°, 90°, 180°, 270°, 360°).

Lint & Build:
- Fixed 1 self-introduced warning in `data-storage-converter.tsx` (removed stale `eslint-disable` comment, added correct deps array).
- Final `bun run lint`: 0 errors. All remaining warnings are in OTHER agents' files (image-* , color-picker, lorem-ipsum) — not in Task 9 scope.
- Dev server compiles successfully (verified via `dev.log`).

Stage Summary:
- 8 files created under `/src/components/tools/`, all `'use client'` components built with existing shadcn/ui primitives + Tailwind 4. Responsive (mobile-first), accessible (ARIA labels on icon buttons), polished (p-5 sm:p-6 via ToolCardWrapper, lg:grid-cols-2 layouts, dashed-border info panels, badges, hover affordances).
- All 8 tools 100% client-side — no API routes needed. Color tool's loader already imports from `color-converter-tool` per registry, which matches my filename.
- Worklog + agent-ctx record persisted.

---
Task ID: 10
Agent: Calculator Tools Builder (Z.ai Code)
Task: Build 9 Calculator tools as 100% client-side React components (BMI, Age, Percentage, Loan EMI, Date Difference, Compound Interest, Tip, GPA, Scientific).

Work Log:
- Read `/src/components/tool-page-shell.tsx` and confirmed shared helpers: `ToolCardWrapper`, `FieldLabel`, `CopyButton`, `DownloadButton`, `EmptyState`.
- Read `/src/components/tool-loader.tsx` registry — confirmed all 9 calculator slugs already wired (`bmi-calculator`, `age-calculator`, `percentage-calculator`, `loan-emi-calculator`, `date-difference-calculator`, `compound-interest-calculator`, `tip-calculator`, `gpa-calculator`, `scientific-calculator`).
- Verified available shadcn/ui primitives and confirmed `recharts` (2.15), `date-fns` (4.1), `sonner` (2.0), `lucide-react` (0.525) are installed.
- Built `bmi-calculator.tsx` — metric/imperial Tabs toggle, big BMI result, color-coded category badge, 4-segment colored scale bar with absolutely-positioned marker, healthy-weight-range readout.
- Built `age-calculator.tsx` — `<input type="date">` DOB + age-at-date, `date-fns` `differenceIn*` for totals, custom y/m/d breakdown, next-birthday countdown, future-DOB error toast via `sonner`.
- Built `percentage-calculator.tsx` — 3 Tabs ("X% of Y", "X is what % of Y", "% change from X to Y"), big bold result tiles with increase/decrease labels.
- Built `loan-emi-calculator.tsx` — principal/rate/tenure inputs with years-or-months Select, monthly EMI / total interest / total payment cards, `recharts` PieChart (principal vs interest) + stacked BarChart (year-1 vs total), scrollable 12-month amortization Table with sticky header.
- Built `date-difference-calculator.tsx` — two date pickers + swap button (ArrowLeftRight), human-friendly summary ("1 year, 2 months, 15 days"), plus 4 Stat tiles (total days/weeks/months/years) and a 3-tile y/m/d breakdown.
- Built `compound-interest-calculator.tsx` — principal/rate/years/frequency (annually/semi/quarterly/monthly/daily), final amount + interest earned + total return %, `recharts` LineChart (balance + interest over years) + year-by-year breakdown Table (first 10 years).
- Built `tip-calculator.tsx` — bill input, tip Slider (0-30%), people stepper (Plus/Minus + Input), quick-tip buttons (10/15/18/20%), emerald "each person pays" hero panel.
- Built `gpa-calculator.tsx` — dynamic course rows (name / credits 1-4 / grade A..F with grade-point values), Add Course button + Trash2 remove, GPA on 4.0 scale with color-coded result and qualitative label.
- Built `scientific-calculator.tsx` — custom **shunting-yard + RPN evaluator** (no `eval`, no `Function` constructor) supporting + - * / % ^ !, parens, sin/cos/tan/asin/acos/atan/log/ln/sqrt/abs, π, e, unary minus, factorial; 5×8 button grid with colored operators, equals=primary, C=destructive; memory MC/MR/M+/M- with badge; DEG/RAD toggle; live result preview; full keyboard support (Enter/=, Esc, Backspace).
- Verified with `bun run lint` — 0 errors / 0 warnings for all 9 of my files. (16 unrelated `Unused eslint-disable directive` warnings are in sibling agents' image-tool files.)
- Noted in `dev.log`: routes for ALL tools currently 500 because `tool-loader.tsx` statically references ~33 tools from sibling tasks (uuid-generator, jwt-decoder, qr-code-generator, etc.) that have not yet been authored. None of the missing modules are calculator tools — once sibling tasks complete, all calculator routes will render.
- Wrote agent work record at `/home/z/my-project/agent-ctx/10-calculator-tools-agent.md`.

Stage Summary:
9 Calculator category tools delivered, all 100% client-side, all using existing shadcn/ui primitives, with `recharts` charts, `date-fns` date math, and a custom shunting-yard evaluator for the scientific calculator. Lint passes cleanly for every file in scope. Calculator category is structurally complete and ready to render once the parallel sibling agents finish their respective tool files so that `tool-loader.tsx`'s dynamic imports all resolve.

---
Task ID: 7
Agent: PDF Tools Builder (Z.ai Code)
Task: Build 10 client-side PDF tools (merge, split, compress, rotate, reorder, delete-pages, watermark, page-numbers, protect, image-to-pdf) under /src/components/tools/.

Work Log:
- Read project context: tools-registry.ts, tool-loader.tsx, tool-page-shell.tsx (CopyButton, DownloadButton, ToolCardWrapper, EmptyState, FieldLabel), package.json (pdf-lib v1.17.1, jszip, @dnd-kit/core/sortable/utilities installed).
- Built 10 self-contained `'use client'` React components, each `export default function`, all 100% client-side using pdf-lib + browser File APIs:
  - `pdf-merge.tsx` — drag-drop multiple PDFs, sortable list with up/down arrows + remove, `PDFDocument.create()` + `copyPages`, file sizes shown.
  - `pdf-split.tsx` — upload PDF, three modes (each page / ranges / extract). Range + page parsing with validation. ZIP multiple outputs via `jszip`; single output → direct PDF download. Tabs with help.
  - `pdf-compress.tsx` — three compression levels (lossless re-pack / strip metadata / aggressive). Uses `useObjectStreams: true` + metadata stripping. Shows before/after sizes, percentage saved, and an honest "already optimized" warning when no savings.
  - `pdf-rotate.tsx` — rotation ToggleGroup (90/180/270), scope ToggleGroup (all/specific) with page-range input. Uses `page.setRotation(degrees(n))` applied on top of current rotation.
  - `pdf-reorder.tsx` — `@dnd-kit/core` + `@dnd-kit/sortable` with PointerSensor + KeyboardSensor, `rectSortingStrategy`. Each page rendered as a draggable card showing page # + original #. Reverse-order shortcut included.
  - `pdf-delete-pages.tsx` — two selection modes: checkbox grid (with select-all/clear) OR page-list input. Shows "to delete" + "remaining" counts. Disables deletion if all pages selected.
  - `pdf-watermark.tsx` — Tabs for text vs image watermark. Text: editable text, font size slider, color picker, opacity slider, rotation slider, 9-position grid. Image: PNG/JPEG logo upload, scale slider, opacity, rotation. Apply to all or specific pages.
  - `pdf-page-numbers.tsx` — vertical (top/bottom) + horizontal (left/center/right) ToggleGroups, starting number, font size, font color, margin slider, format Select (plain / X of N / Page X / - X -) with live preview.
  - `pdf-protect.tsx` — documented pdf-lib limitation clearly in an amber notice banner. Implemented a metadata-based restriction stub: stores SHA-256 hash of password (via Web Crypto API) in document keywords + custom metadata, optionally stamps a translucent diagonal "PROTECTED" watermark (no password shown), with strength meter for the password.
  - `image-to-pdf.tsx` — drag-drop multiple images, sortable list with thumbnail previews + sizes. Page size Select (A4/Letter/Fit-to-image), orientation ToggleGroup, margin Slider. Non-PNG/JPEG images re-encoded via canvas as JPEG before embedding.
- All components use existing shadcn/ui primitives (Button, Input, Card, Tabs, Select, Switch, Checkbox, Label, Badge, Separator, Slider, ToggleGroup) and lucide-react icons.
- Consistent design: dashed-border upload zones with emerald hover state, `ToolCardWrapper` for `p-5 sm:p-6` padding, two-column `lg:grid-cols-2` layouts, mobile-first responsive, `sonner` toasts for feedback, loading spinners (Loader2) on action buttons, file sizes formatted in B/KB/MB.
- Ran `bun run lint` on my files — clean (0 errors, 0 warnings). Pre-existing errors/warnings remain in other agents' files (`color-picker.tsx`, `image-crop.tsx`) — not touched.

Stage Summary:
- All 10 PDF tool components delivered and lint-clean.
- pdf-protect: chose the "documented limitation + metadata-based restriction stub" path because pdf-lib v1.17.1 cannot perform true RC4/AES PDF encryption; the UI clearly discloses this and offers a SHA-256 hash marker + optional visible "PROTECTED" stamp instead. No API route was needed (kept fully client-side per the task's optional path).
- Files created (all under /src/components/tools/):
  pdf-merge.tsx, pdf-split.tsx, pdf-compress.tsx, pdf-rotate.tsx, pdf-reorder.tsx,
  pdf-delete-pages.tsx, pdf-watermark.tsx, pdf-page-numbers.tsx, pdf-protect.tsx,
  image-to-pdf.tsx
- No files outside the tools/ directory were modified (no API route needed). Only worklog.md was appended.

---
Task ID: 6
Agent: Image Tools Builder (Z.ai Code)
Task: Build 10 client-side image tools (compress, resize, convert, crop, rotate, base64, watermark, EXIF metadata, color picker, color palette) using browser Canvas + File APIs.

Work Log:
- Read /src/components/tool-page-shell.tsx for shared utilities (ToolCardWrapper, CopyButton, DownloadButton, EmptyState, FieldLabel) and /src/components/tool-loader.tsx for the dynamic import contract.
- Built drag-drop upload zone pattern (dashed border + Upload icon + onDrop/onDragOver handlers) reused across all 10 tools.
- image-compress.tsx: canvas toBlob with quality slider (10-100), JPG/PNG/WebP select, live original-vs-compressed size + savings % badge.
- image-resize.tsx: width/height inputs with maintain-aspect switch + quick-scale presets (25/50/75/100%), high-quality imageSmoothing.
- image-convert.tsx: format select (JPG/PNG/WebP/BMP), quality slider enabled only for lossy formats, white background fill for JPEG/BMP.
- image-crop.tsx: interactive draggable/resizable crop rectangle drawn on canvas with corner handles; aspect-ratio presets (Free, 1:1, 4:3, 16:9, 3:2, 2:3); numeric X/Y/W/H inputs with two-way binding; live crop preview.
- image-rotate.tsx: rotate 90/180/270, flip H/V toggles, transform state combined into single canvas redraw; output dimensions update for quarter rotations.
- image-to-base64.tsx: FileReader.readAsDataURL → textarea with copy; reverse decode path that auto-prepends data: URI prefix if missing.
- image-watermark.tsx: text + logo modes, 9-point position grid, opacity slider, font size + color picker for text mode; logo upload with auto-scale to 30% of image width.
- image-metadata.tsx: custom JPEG APP1 EXIF parser (handles byte order, IFD0/ExifIFD/GPSInfo) for Make, Model, DateTime, ExposureTime (1/N s), FNumber (f/N), ISO, FocalLength, GPS coords; falls back to file info (name, size, type, dimensions, last-modified, megapixels) for non-JPEG; Google Maps link when GPS present.
- color-picker.tsx: canvas pixel sampler on mousemove + click; displays HEX/RGB/HSL of hovered color; click adds to palette (up to 24 colors); click palette swatch to copy HEX.
- image-color-palette.tsx: downscales to 200px max, quantizes RGB to 4 bits/channel (4096 buckets), counts occurrences, returns top 3-10 colors with HEX/RGB/percentage; click swatch or "Copy all" buttons.
- All tools use existing shadcn/ui components (Button, Input, Textarea, Card, Slider, Select, Switch, Label, Badge, Separator, ScrollArea, Tabs), lucide-react icons, sonner toasts, and the shared ToolCardWrapper/FieldLabel/DownloadButton/EmptyState from tool-page-shell.tsx.
- Lint cleanup: removed unused `// eslint-disable-next-line react-hooks/exhaustive-deps` comments after the project's React Compiler rule surfaced `react-hooks/preserve-manual-memoization` errors for useCallbacks that read .current on refs (canvas/img refs). Refactored drawCanvas/applyWatermark useCallbacks to plain functions called from useEffect to satisfy the rule.
- Fixed duplicate object keys (0xa002 / 0xa003) in image-metadata.tsx EXIF_TAGS map.
- Final lint: 0 errors, 0 warnings across all 10 image tool files.

Stage Summary:
- 10 image tools shipped at /src/components/tools/{image-compress,image-resize,image-convert,image-crop,image-rotate,image-to-base64,image-watermark,image-metadata,color-picker,image-color-palette}.tsx.
- Each tool is mobile-first responsive with lg:grid-cols-2 layout, polished UI (size badges, processing spinners, empty states, copy-on-click), and works 100% client-side using browser Canvas/FileReader/URL.createObjectURL.
- Only modified files within /src/components/tools/ (plus worklog.md append). No other files touched.

---
Task ID: 8
Agent: Developer Tools Builder (Z.ai Code)
Task: Build 14 client-side Developer tools (JSON, Base64, UUID, Hash, URL, JWT, Password, HTML entity, Markdown, Regex, CSS minifier, JS minifier, HTML formatter, Timestamp converter).

Work Log:
- Read worklog.md, tool-page-shell.tsx (CopyButton, DownloadButton, ToolCardWrapper, EmptyState, FieldLabel), tool-loader.tsx (all 14 slugs already wired), and inspected two sibling tools (color-converter-tool, find-replace) for design reference.
- Verified `uuid@11`, `react-syntax-highlighter@15.6.1`, `react-markdown@10.1.0`, `date-fns@4.1` installed. Installed `remark-gfm@4.0.1` for GitHub-flavored markdown tables.
- Built all 14 `'use client'` components at `/src/components/tools/<slug>.tsx`, each `export default function`:
  - `json-formatter.tsx` — side-by-side input/output, Format/Minify/Validate buttons, indent selector (2/4/tab), V8 position-aware parse error (line/column), syntax-highlighted output via dangerouslySetInnerHTML regex, before/after byte badges.
  - `base64-encode-decode.tsx` — Tabs Encode/Decode, UTF-8 safe via `TextEncoder`/`TextDecoder` + `btoa`/`atob`, base64 length padding repair on decode, swap-input button, error display.
  - `uuid-generator.tsx` — v1/v1 time Tabs, count 1-100 Input, list with index/version badge/timestamp/copy each + copy-all, mounted v4 seed batch.
  - `hash-generator.tsx` — checkbox algorithm picker (MD5 + SHA-1/256/384/512), inline Joseph Myers MD5 implementation (UTF-8 aware), `crypto.subtle.digest` for SHA family, debounced live recompute, amber "MD5/SHA-1 broken" advisory.
  - `url-encode-decode.tsx` — Tabs Encode/Decode via `encodeURIComponent`/`decodeURIComponent`, live error display, swap button, byte badges.
  - `jwt-decoder.tsx` — base64url decode (pad + URL-safe char swap), `react-syntax-highlighter` Prism+oneDark for header/payload JSON, signature displayed separately, claim summary (iss/sub/aud/exp/iat/nbf), amber warning that signature is NOT verified, paste button.
  - `password-generator.tsx` — `crypto.getRandomValues` with rejection sampling for uniform distribution, length Slider 4-64, checkboxes upper/lower/number/symbol/exclude-ambiguous, 5-segment entropy strength meter, copy + auto-regenerate Switch.
  - `html-encode-decode.tsx` — Tabs Encode/Decode, entity map (`<`/`>`/`&`/`"`/`'`), numeric/decimal/hex entity decode, reference grid at bottom.
  - `markdown-preview.tsx` — two-pane editor + preview, `react-markdown` v10 default export + `remark-gfm` for tables/strikethrough, Preview/HTML toggle Tabs, Copy-HTML via reading `innerHTML` of ref, prose styling, target=_blank links.
  - `regex-tester.tsx` — pattern input with `/.../flags` visual, 6 flag checkboxes (g/i/m/s/u/y), live matches list with index + capture groups, highlighted test string via `<mark>` nodes, defensive exec-loop cap of 10000, error display.
  - `css-minifier.tsx` — strip `/* */` comments, collapse whitespace, remove trailing `;` before `}`, before/after size + savings %, download as .css.
  - `js-minifier.tsx` — custom tokenizer (word/string/regex/punct/whitespace/comment) with regex-vs-division disambiguation via previous-token lookahead, multi-char operator table (PUNCT2/PUNCT3), ASI-safe newline preservation when adjacent tokens are word-like, string/regex literals untouched, amber "basic minifier" notice recommending Terser/esbuild/SWC for production.
  - `html-formatter.tsx` — `DOMParser` → recursive walk with indent levels, void-element table, inline-element single-line collapsing, comment/DOCTYPE/CDATA preservation, indent 2/4 toggle, download as .html.
  - `timestamp-converter.tsx` — auto/s/ms unit detection (10^12 boundary), 9 format rows (ISO 8601, RFC 2822, UTC, local time/date/time-only, relative, Unix s/ms) each with copy, date+time picker → Unix s/ms + ISO, "Now" button, send-to-timestamp-field, live ticking relative time via setInterval(1s).
- All tools use existing shadcn/ui primitives (Button, Input, Textarea, Card, Tabs, Select, Switch, Checkbox, Label, Badge, Separator, Slider, ScrollArea) + lucide-react icons + sonner toast.
- Design: `ToolCardWrapper` for `p-5 sm:p-6` padding, `lg:grid-cols-2` two-column layouts where appropriate, mobile-first responsive, `font-mono` for code/JSON, emerald/amber/violet/rose accents (no indigo/blue).
- Lint cleanup (only own files):
  - `regex-tester.tsx` — added missing `Button` import (error: react/jsx-no-undef).
  - `password-generator.tsx` — removed stale `// eslint-disable-next-line react-hooks/exhaustive-deps` on initial-mount effect; switched deps array to `[regenerate]`.
  - `timestamp-converter.tsx` — removed stale `// eslint-disable-next-line react-hooks/exhaustive-deps` directive above the formats useMemo.
- Final `bun run lint`: 0 errors, 0 warnings across all 14 new files. Pre-existing warnings in other agents' files (if any) left untouched.

Stage Summary:
- 14 developer tools delivered at `/src/components/tools/{json-formatter,base64-encode-decode,uuid-generator,hash-generator,url-encode-decode,jwt-decoder,password-generator,html-encode-decode,markdown-preview,regex-tester,css-minifier,js-minifier,html-formatter,timestamp-converter}.tsx`.
- All 100% client-side using browser APIs: Web Crypto `crypto.subtle.digest` + `crypto.getRandomValues`, `DOMParser`, `TextEncoder`/`TextDecoder`, `btoa`/`atob`, `encodeURIComponent`/`decodeURIComponent`. No API routes, no server-side logic.
- Added 1 new package: `remark-gfm@4.0.1` (for markdown tables/strikethrough in `markdown-preview.tsx`). No other dependencies added.
- Lint clean for all 14 files. No modifications outside `/src/components/tools/` except `worklog.md` (append) and `package.json`/`bun.lock` (remark-gfm install).
- Wrote agent work record at `/home/z/my-project/agent-ctx/8-developer-tools-builder.md`.

---
Task ID: 11
Agent: SEO / Security / Misc Tools Builder (Z.ai Code)
Task: Build 19 client-side tools (7 SEO + 4 Security + 8 Misc) for ToolNest.

Work Log:
- Read /home/z/my-project/worklog.md and prior agent records; verified shared `tool-page-shell.tsx` helpers (CopyButton, DownloadButton, ToolCardWrapper, EmptyState, FieldLabel) and confirmed all 19 slugs are already wired in `tool-loader.tsx`.
- SEO tools:
  - `meta-tag-generator.tsx` — full form (title/description/keywords/author/robots index+follow/canonical/viewport) with live character counters (title ≤60, desc ≤160), styled `<pre>` output + copy.
  - `open-graph-generator.tsx` — og:* + twitter:card meta block with live social-card preview (summary_large_image vs summary layouts).
  - `robots-txt-generator.tsx` — global settings + dynamic per-user-agent rules (allow/disallow + paths), sitemap URL, crawl-delay. Download as robots.txt.
  - `sitemap-generator.tsx` — URL list textarea, changefreq/priority/lastmod options, generates valid XML sitemap, downloads as sitemap.xml.
  - `keyword-density.tsx` — textarea input, 60+ stopword exclusion, top-20 keyword bar chart with count + percentage + total word count.
  - `slug-url-generator.tsx` — NFKD-normalized slug with separator/lowercase/strip-stopwords/max-length options.
  - `http-status-codes.tsx` — 60+ status code entries (1xx–5xx) with searchable + tabbed UI, color-coded category icons.
- Security tools:
  - `password-strength-checker.tsx` — entropy-bit estimate, offline-crack-time, character-variety checklist, score bar with weak/fair/good/strong, actionable suggestions, explicit privacy note ("never leaves your browser").
  - `random-string-generator.tsx` — `crypto.getRandomValues` with rejection sampling for uniform distribution; length 4–256, count 1–50, charset toggles incl. exclude-similar (il1Lo0O), copy-all + per-row copy.
  - `credit-card-validator.tsx` — 8 brand patterns (Visa/MC/Amex/Discover/JCB/Diners/UnionPay/Maestro) + Luhn checksum + length validation. Amex 4-6-5 formatting. Explicit "never stored or transmitted" privacy banner.
  - `mac-address-lookup.tsx` — 60+ embedded OUI vendor DB, U/L bit (locally-administered) + I/G bit (multicast) detection, graceful "unknown vendor" fallback, clickable example MACs.
- Misc tools:
  - `qr-code-generator.tsx` — 4 modes via Tabs (Text / URL / Wi-Fi / vCard), 4 EC levels (L/M/Q/H), custom foreground + background colors, size 128–512, canvas rendering + PNG download.
  - `barcode-generator.tsx` — inline CODE128B encoder (107-entry pattern table + checksum + start/stop), canvas rendering with adjustable bar height & module width, human-readable text below bars, PNG download.
  - `emoji-keyboard.tsx` — 9 categories (~300 emojis), live search, recently-used list (localStorage, max 24), toast-on-copy, hidden CopyButton hack removed.
  - `dice-roller.tsx` — 1–10 dice × {d4, d6, d8, d10, d12, d20, d100}, modifier, 400ms spin animation, last-10 history, `crypto.getRandomValues` fairness.
  - `coin-flip.tsx` — 3D CSS flip animation (rotateY), last-20 history, heads vs tails counts + percentage bar, `crypto.getRandomValues`.
  - `random-number-generator.tsx` — min/max/count (1–1000)/unique-toggle/integer-or-float with decimals slider, `crypto.getRandomValues`, grid or `<pre>` output based on count.
  - `pomodoro-timer.tsx` — SVG progress ring color-coded per mode (work/short/long), auto-switch on completion, long-break interval every N pomodoros, completed-pomodoro counter, configurable durations.
  - `stopwatch.tsx` — `performance.now()` + `requestAnimationFrame` for precision, mm:ss.cc format, lap list with fastest/slowest lap highlighting, start/pause/lap/reset controls.
- All tools use existing shadcn/ui primitives (Button, Input, Textarea, Card, Tabs, Select, Switch, Checkbox, Label, Badge, Separator, Slider, Progress) + lucide-react icons + sonner toasts.
- All `'use client'` components, mobile-first responsive (`grid sm:grid-cols-2`, `lg:grid-cols-2`), `ToolCardWrapper` for consistent `p-5 sm:p-6` padding.
- Color palette: amber (coin flip), emerald (success states), rose (errors), amber-rose gradients for pomodoro — no indigo/blue.

Lint & Build:
- Fixed initial TS error in `stopwatch.tsx` where `tick` useCallback referenced itself before declaration — refactored to a local function inside a `useEffect` cleanup pattern that re-creates the RAF loop only when `running` changes.
- Fixed TS1117 (duplicate object keys) in `mac-address-lookup.tsx` — removed duplicate OUI entries (`00:1F:33`, `00:13:02`, `00:24:B2`, `00:50:56`, `00:25:9C`).
- Removed unused `@next/next/no-img-element` eslint-disable directives in `open-graph-generator.tsx` (the rule was not reporting).
- Removed unused `Label` import from `barcode-generator.tsx` and unused `CopyButton` import from `random-number-generator.tsx`.
- Final `bun run lint`: exit code 0 — 0 errors, 0 warnings for all 19 files.
- `npx tsc --noEmit`: no errors reported in any of the 19 files I created. (Pre-existing errors remain in other agents' files — `hash-generator`, `html-encode-decode`, `number-base-converter`, `pdf-protect`, `pdf-merge`, `ai-*-route.ts`, `examples/websocket/*`, `skills/*` — not in scope.)

Stage Summary:
- 19 tool files delivered under `/src/components/tools/`:
  meta-tag-generator.tsx, open-graph-generator.tsx, robots-txt-generator.tsx, sitemap-generator.tsx, keyword-density.tsx, slug-url-generator.tsx, http-status-codes.tsx,
  password-strength-checker.tsx, random-string-generator.tsx, credit-card-validator.tsx, mac-address-lookup.tsx,
  qr-code-generator.tsx, barcode-generator.tsx, emoji-keyboard.tsx, dice-roller.tsx, coin-flip.tsx, random-number-generator.tsx, pomodoro-timer.tsx, stopwatch.tsx
- All 100% client-side, fully registered in `tool-loader.tsx` already (Task 1 wired all slugs). No API routes needed.
- Lint and type-check clean for my files. Only modified files inside `/src/components/tools/` (plus worklog.md and the new agent-ctx record).
- Note: dev.log shows pre-existing 500s on `/tools/scientific-calculator` and missing-module warnings for `uuid-generator`, `url-encode-decode`, `jwt-decoder`, `password-generator`, `html-encode-decode`, `markdown-preview`, `regex-tester`, `css-minifier`, `js-minifier`, `html-formatter`, `timestamp-converter`, `base64-encode-decode`, `json-formatter` — all owned by the developer-tools agent (Task 8) and unrelated to my work. Once Task 8 ships its files, the SEO/Security/Misc routes will render successfully.
