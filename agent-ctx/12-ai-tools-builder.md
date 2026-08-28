# Task 12 — AI Tools Builder (Z.ai Code)

## Task description
Build 6 AI tools (image generator, content writer, image describer, chat assistant, summarizer, translator) plus their backend API routes using z-ai-web-dev-sdk.

## Files created

### API routes (`/src/app/api/ai/`)
| Route | Endpoint | SDK feature used |
|------|---------|------------------|
| `image-generator/route.ts` | POST `/api/ai/image-generator` | `zai.images.generations.create` |
| `content-writer/route.ts` | POST `/api/ai/content-writer` | `zai.chat.completions.create` |
| `image-describer/route.ts` | POST `/api/ai/image-describer` | VLM (chat.completions with image_url content block) |
| `chat-assistant/route.ts` | POST `/api/ai/chat-assistant` | `zai.chat.completions.create` (multi-turn) |
| `summarizer/route.ts` | POST `/api/ai/summarizer` | `zai.chat.completions.create` (JSON output) |
| `translator/route.ts` | POST `/api/ai/translator` | `zai.chat.completions.create` (auto-detect fallback) |

All routes: `runtime='nodejs'`, `dynamic='force-dynamic'`, `POST(req: NextRequest)`, try/catch with friendly 429 rate-limit handling.

### Tool components (`/src/components/tools/`)
| Component | Key features |
|-----------|-------------|
| `ai-image-generator.tsx` | prompt + size select, image grid w/ download, save-to-gallery, example prompts, regenerate |
| `ai-content-writer.tsx` | type/tone/length selects, styled output, word count, copy + .txt download |
| `ai-image-describer.tsx` | drag-drop upload, preview, AI description card with thumbnail, copy |
| `ai-chat-assistant.tsx` | chat bubbles (user right/assistant left), sticky input, max-h-[60vh] scroll, suggested prompts |
| `ai-summarizer.tsx` | summary paragraph + numbered key points, separate copy buttons |
| `ai-translator.tsx` | 21 languages, auto-detect badge, copy |

## Lint issues encountered & resolutions
1. **`react-hooks/rules-of-hooks` error** in `ai-image-generator.tsx` — function named `useExample` triggered false-positive hook detection. Renamed to `applyExample`.
2. **4 unused `eslint-disable @next/next/no-img-element` warnings** — the project's eslint config doesn't enforce that rule. Removed directives in `ai-image-generator.tsx` (2) and `ai-image-describer.tsx` (2).
3. **Unused imports** in `ai-chat-assistant.tsx` — removed `ScrollArea` and `Card` imports.

## Final lint state for my files
`bun run lint`: 0 errors, 0 warnings across all 12 created files. (Pre-existing warnings in other tasks' files — image-compress, image-convert, image-crop, image-metadata, image-resize, image-rotate, image-to-base64, image-watermark, lorem-ipsum — were left untouched per task scope.)

## Worklog
Appended to `/home/z/my-project/worklog.md` (new section starting with `---`, Task ID 12).
