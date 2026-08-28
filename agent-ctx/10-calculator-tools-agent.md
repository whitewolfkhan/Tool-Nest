# Task 10 — Calculator Tools Agent

**Task ID:** 10
**Agent:** Calculator Tools Builder (Z.ai Code)
**Scope:** Build 9 React client components for the Calculator tools category.

## Files Created
All files under `/home/z/my-project/src/components/tools/`:

1. `bmi-calculator.tsx` — BMI Calculator with metric/imperial unit toggle (Tabs), big result, color-coded category badge, and a 4-segment colored BMI scale bar with an absolutely-positioned marker. Also shows healthy weight range for the user's height.
2. `age-calculator.tsx` — Date-of-birth + age-at-date inputs. Uses `date-fns` `differenceIn*` helpers. Renders years/months/days, plus Stat tiles for total days/hours/minutes, plus next-birthday countdown. Surfaces future-date errors via `sonner` toast.
3. `percentage-calculator.tsx` — Three-tabbed interface: "X% of Y", "X is what % of Y", and "% change from X to Y". Each tab computes live and shows a big bold result line with increase/decrease label.
4. `loan-emi-calculator.tsx` — Loan principal, annual rate, tenure (years/months Select). Outputs monthly EMI, total interest, total payment. Renders a `recharts` PieChart (principal vs interest) + stacked BarChart (year-1 vs total), plus a scrollable 12-month amortization Table with sticky header.
5. `date-difference-calculator.tsx` — Two date pickers + a swap button (ArrowLeftRight icon). Human-friendly summary ("1 year, 2 months, 15 days"), plus 4 Stat tiles for total days/weeks/months/years and a 3-tile y/m/d breakdown.
6. `compound-interest-calculator.tsx` — Principal, rate, years, compounding-frequency Select (annually/semi/quarterly/monthly/daily). Final amount + interest earned + total return %, plus a `recharts` LineChart (balance & interest curves) and a year-by-year breakdown Table (first 10 years).
7. `tip-calculator.tsx` — Bill amount, tip-percentage Slider (0-30%), number-of-people stepper (Plus/Minus buttons + Input). Quick tip buttons (10/15/18/20%). Shows tip amount, total bill, tip-per-person, and a prominent "each person pays" emerald panel.
8. `gpa-calculator.tsx` — Dynamic course rows: name (optional Input), credits (Select 1-4), grade (Select A/A-/B+/B/B-/C+/C/C-/D/F). Add Course / remove (Trash2) buttons. Computes GPA on a 4.0 scale with color-coded result (emerald/lime/amber/rose) and a label (Excellent / Very Good / Good / Satisfactory / Needs Improvement).
9. `scientific-calculator.tsx` — Custom **shunting-yard expression evaluator** (NO `eval`, NO `Function` constructor) supporting + - * / % ^ !, parentheses, sin/cos/tan/asin/acos/atan/log/ln/sqrt/abs, π, e, unary minus, factorial. 5-column button grid with colored operators, equals button (primary), C (destructive), ⌫. Memory: MC / MR / M+ / M- with badge indicator when memory ≠ 0. DEG/RAD angle-mode toggle. Live result preview while typing. Full keyboard support (Enter = =, Esc = clear, Backspace = delete).

## Approach & Design Decisions
- All components are 100% client-side (`'use client'`), no API calls.
- Reused existing shadcn/ui primitives: `Button`, `Input`, `Tabs`, `Select`, `Badge`, `Separator`, `Slider`, `Table`, `Calendar` (via tool-page-shell).
- Used `lucide-react` icons (Minus, Plus, Users, Trash2, ArrowLeftRight) — no new icon libraries.
- Used `recharts` for charts (BarChart, PieChart, LineChart with CartesianGrid, Tooltip, Legend, Cell).
- Used `date-fns` v4 (`differenceInDays/Hours/Minutes/Months/Years/Weeks`, `format`, `addDays`).
- Used `sonner` for error toasts (Age calculator: future-DOB errors; Scientific calculator: invalid expression).
- Visual polish: big bold results (`text-4xl`/`text-5xl font-bold`), color-coded categories (emerald/lime/amber/rose), `tabular-nums` for numeric alignment, scrollable tables with sticky headers, mobile-first responsive grids (`grid-cols-2 sm:grid-cols-3/4`).
- Currency formatting: `toLocaleString` with `style: 'currency', currency: 'USD'`.
- Numbers use `toLocaleString` for thousands separators.
- Sticky footer / safe area / breadcrumb / related-tools all handled by the shared `ToolPageShell` wrapper provided by `tool-loader.tsx`.

## Lint Status
- Ran `cd /home/z/my-project && bun run lint 2>&1 | tail -30`.
- Result: **0 errors, 16 warnings** — all 16 warnings are `Unused eslint-disable directive` warnings in OTHER agents' files (color-picker, image-color-palette, image-compress, image-convert, image-crop, image-metadata, image-resize, image-rotate, image-to-base64, image-watermark). None of my 9 calculator files produced any lint error or warning.

## Runtime Verification Note
- Visiting `/tools/<calculator-slug>` currently returns HTTP 500 because `src/components/tool-loader.tsx` statically references tools from ALL categories (PDF, Image, Text, Developer, Converter, Calculator, SEO, Security, Misc, AI). Many of those other tools (uuid-generator, hash-generator, jwt-decoder, url-encode-decode, html-encode-decode, html-formatter, js-minifier, css-minifier, regex-tester, markdown-preview, timestamp-converter, qr-code-generator, barcode-generator, emoji-keyboard, dice-roller, coin-flip, random-number-generator, pomodoro-timer, stopwatch, password-strength-checker, random-string-generator, credit-card-validator, mac-address-lookup, meta-tag-generator, open-graph-generator, robots-txt-generator, sitemap-generator, keyword-density, slug-url-generator, http-status-codes, json-formatter, base64-encode-decode) have NOT yet been built by sibling agents. Once all sibling tasks finish, the routes will resolve.
- Confirmed in `/home/z/my-project/dev.log`: ALL "Module not found: Can't resolve '@/components/tools/<X>'" errors are for files belonging to OTHER task IDs. None of the missing modules are calculator tools.
- Each of my 9 files was syntax-validated by ESLint (which parses TSX via the Next.js ESLint config) with zero errors/warnings.

## Stage Summary
9 calculator tools delivered, all 100% client-side, all using existing shadcn/ui primitives, with recharts charts, date-fns date math, and a custom shunting-yard evaluator for the scientific calculator (no `eval`). Lint passes cleanly for all 9 files. The Calculator category is fully populated and ready to render as soon as the sibling agents complete their respective tool files so that `tool-loader.tsx` can resolve all of its dynamic imports.
