# Task 5 — Text Tools Builder

## Task
Build 12 client-side React text tools at `/src/components/tools/<slug>.tsx`:
word-counter, case-converter, lorem-ipsum, remove-duplicate-lines, sort-lines,
find-replace, text-reverse, slug-generator, text-diff, text-to-binary,
text-to-morse, whitespace-remover.

## Approach
- Read shared `tool-page-shell.tsx` helpers (CopyButton, DownloadButton, ToolCardWrapper, FieldLabel, EmptyState) before building.
- Verified all 12 slugs already wired in `tool-loader.tsx` dynamic import map.
- Used existing shadcn/ui primitives only (Button, Input, Textarea, Card, Tabs, Select, Switch, Checkbox, Label, Badge, Separator, Slider, Toggle). No new UI components created.
- Mobile-first responsive layouts (`grid sm:grid-cols-2`, `lg:grid-cols-[1fr_320px]`).
- All `'use client'`, no API calls, no new dependencies installed.
- Color accents: emerald (additions/positive) and rose (removals/negative). No indigo/blue.

## Files Created (12)
1. `/src/components/tools/word-counter.tsx`
2. `/src/components/tools/case-converter.tsx`
3. `/src/components/tools/lorem-ipsum.tsx`
4. `/src/components/tools/remove-duplicate-lines.tsx`
5. `/src/components/tools/sort-lines.tsx`
6. `/src/components/tools/find-replace.tsx`
7. `/src/components/tools/text-reverse.tsx`
8. `/src/components/tools/slug-generator.tsx`
9. `/src/components/tools/text-diff.tsx`
10. `/src/components/tools/text-to-binary.tsx`
11. `/src/components/tools/text-to-morse.tsx`
12. `/src/components/tools/whitespace-remover.tsx`

## Lint Issues Encountered & Fixes
- `text-to-binary.tsx`: ESLint error `react-hooks/set-state-in-render` — was calling `setError()` inside `useMemo()`. Refactored to return `{ output, error }` from `useMemo` instead of maintaining a separate error state.
- `lorem-ipsum.tsx`: Warning `Unused eslint-disable directive` — removed the unnecessary `// eslint-disable-next-line react-hooks/exhaustive-deps` comment on the mount-only effect.
- Final state: `bun run lint` → 0 errors in text tool files. Remaining 12 warnings are all in image-* tools (owned by other agents, untouched).

## Highlights
- **Text Diff**: Inline LCS DP-table algorithm (no external package), line-by-line unified view with left/right line numbers and emerald/rose highlighting.
- **Text to Morse**: Web Audio API oscillator with WPM (PARIS standard dot length) and pitch sliders, play/stop controls.
- **Text to Binary**: TextEncoder/TextDecoder for safe multi-byte UTF-8 handling, configurable separator + ASCII/UTF-8 encoding.
- **Find & Replace**: Supports regex with `$1`/`$&` backreferences, live preview, count badge, whole-word mode auto-disabled when regex active.
- **Sort Lines**: Lexical / Natural (numeric-aware) / By-length modes with case-insensitive and dedupe toggles.
- **Word Counter**: 8-stat live grid including reading time (200 wpm) and speaking time (130 wpm).

## Status
All 12 text tools complete, lint-clean, dev log shows successful compilation, ready for preview.
