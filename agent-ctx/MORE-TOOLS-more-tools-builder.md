# Task ID: MORE-TOOLS

## Agent
More Tools Builder (12 new client-side tools) — Z.ai Code

## Task
Build 12 new 100% client-side tools for the ToolNest free online tools website and register them in `tools-registry.ts` and `tool-loader.tsx`.

## Tools Built (12)
1. `text-to-speech.tsx` — text — Web Speech API, voice picker, rate/pitch/volume sliders, word highlighting via `onboundary`.
2. `speech-to-text.tsx` — text — Web Speech API, 21 languages, interim results, browser-support notes.
3. `password-strength-analyzer.tsx` — security — entropy calc, 4 crack-time scenarios, 100-common-password check, pattern detection.
4. `image-to-favicon-set.tsx` — image — 10 PNG sizes + favicon.ico (built manually with DataView) + apple-touch + manifest + HTML snippet, ZIP via jszip.
5. `color-shade-generator.tsx` — image — 11-step Tailwind-like scale, 4 modes (full / lighten / darken / hue), CSS/JSON/Tailwind export.
6. `css-gradient-generator.tsx` — developer — linear/radial/conic, up to 5 stops, angle dial, 10 presets.
7. `box-shadow-generator.tsx` — developer — multi-layer (up to 5), inset toggle, 6 presets.
8. `qr-code-reader.tsx` — misc — native BarcodeDetector API, image upload + camera scanning + paste + history.
9. `invoice-generator.tsx` — misc — dynamic line items, 12 currencies, print-to-PDF via new window with auto-print.
10. `text-repeater.tsx` — text — count 1-10000, 6 separator modes, numbering, trim options.
11. `word-frequency-counter.tsx` — text — Recharts bar chart, frequency table, stopwords filter, CSV export.
12. `image-collage-maker.tsx` — image — 5 layouts (2×2, 3×3, horizontal, vertical, 1+2), gap/color/size controls, reorderable thumbnails.

## Registration
- `tools-registry.ts`: 12 entries added across TEXT (4), SECURITY (1), IMAGE (3), DEVELOPER (2), MISC (2). Total tools: 97 → 109.
- `tool-loader.tsx`: 12 `dyn(() => import(...))` entries added in matching category blocks.

## Lint Status
- `bun run lint`: 0 errors, 0 warnings.
- Initial pass had 7 warnings (unused eslint-disable directives) + 1 error (`react-hooks/refs` in speech-to-text.tsx). All resolved.

## HTTP Status (all 200)
| Slug | Status |
|------|--------|
| /tools/text-to-speech | 200 |
| /tools/speech-to-text | 200 |
| /tools/password-strength-analyzer | 200 |
| /tools/image-to-favicon-set | 200 |
| /tools/color-shade-generator | 200 |
| /tools/css-gradient-generator | 200 |
| /tools/box-shadow-generator | 200 |
| /tools/qr-code-reader | 200 |
| /tools/invoice-generator | 200 |
| /tools/text-repeater | 200 |
| /tools/word-frequency-counter | 200 |
| /tools/image-collage-maker | 200 |

## Stack
- All 100% client-side — zero API routes, zero new dependencies.
- Used existing: jszip, recharts, shadcn/ui, lucide-react, sonner.
- All tools: `'use client'`, ToolCardWrapper with `p-5 sm:p-6`, mobile-first responsive, `font-mono` for code.
- No indigo/blue colors. No `.gradient-text` class (known bug).
