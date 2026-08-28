# Task 8 — Developer Tools Builder

Agent: Developer Tools Builder (Z.ai Code)
Task ID: 8
Date: ToolNest build pipeline

## Scope
Build 14 client-side React developer tools at `/src/components/tools/<slug>.tsx` for the ToolNest project:
1. `json-formatter.tsx`
2. `base64-encode-decode.tsx`
3. `uuid-generator.tsx`
4. `hash-generator.tsx`
5. `url-encode-decode.tsx`
6. `jwt-decoder.tsx`
7. `password-generator.tsx`
8. `html-encode-decode.tsx`
9. `markdown-preview.tsx`
10. `regex-tester.tsx`
11. `css-minifier.tsx`
12. `js-minifier.tsx`
13. `html-formatter.tsx`
14. `timestamp-converter.tsx`

## Files created
All 14 files at `/home/z/my-project/src/components/tools/`. See `/home/z/my-project/worklog.md` (final section, Task ID 8) for the full per-file feature breakdown.

## Key technical decisions
- **MD5**: Inline Joseph Myers public-domain implementation (UTF-8 aware via TextEncoder). SHA family uses `crypto.subtle.digest`.
- **Password generator**: `crypto.getRandomValues` with rejection sampling for uniform distribution; entropy-based strength meter.
- **JS minifier**: Custom tokenizer with regex-vs-division lookahead, ASI-safe newline preservation between adjacent word-tokens, string/regex/template-literal literals untouched.
- **HTML formatter**: `DOMParser` + recursive walk with void-element table and inline-element single-line collapsing.
- **JWT decoder**: `react-syntax-highlighter` Prism + oneDark for header/payload JSON.
- **Markdown preview**: `react-markdown` v10 + `remark-gfm` (newly installed) for tables.

## Dependency added
- `remark-gfm@4.0.1` — required for `markdown-preview.tsx` GFM tables/strikethrough.

## Lint status
`bun run lint`: **0 errors, 0 warnings** in all 14 files. Three initial issues self-introduced and fixed:
1. `regex-tester.tsx` — added missing `Button` import (jsx-no-undef).
2. `password-generator.tsx` — removed stale `eslint-disable` directive; updated deps array to `[regenerate]`.
3. `timestamp-converter.tsx` — removed stale `eslint-disable` directive.

## Files modified outside /src/components/tools/
- `worklog.md` (appended Task 8 section)
- `package.json` + `bun.lock` (remark-gfm install)
- This agent record.

No other files touched.
