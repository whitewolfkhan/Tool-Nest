<div align="center">

# 🛠️ ToolNest

### 121+ Free Online Tools — All in One Place

A privacy-first, browser-based toolbox for PDF, Image, Text, Developer, Converter, Calculator, SEO, Security, and AI tasks. No signups, no watermarks, no uploads — your files never leave your device.

</div>

---

## ✨ Features

- **🆓 100% Free** — No signup, no watermark, no usage limits
- **🔒 Privacy-First** — Most tools run entirely in your browser; files never touch a server
- **⚡ Lightning Fast** — Powered by WebAssembly, Canvas, and Web Crypto APIs
- **📱 Responsive** — Mobile-first design that works on every device
- **🌙 Dark Mode** — Light/dark theme with system preference detection
- **⭐ Favorites & Recents** — Save and track your most-used tools (localStorage)
- **🔍 Smart Search** — Find tools by name, keyword, or description instantly
- **🤖 AI-Powered** — 7 AI tools backed by GLM models via z-ai-web-dev-sdk

---

## 📊 Tool Catalog (121 tools across 10 categories)

| Category | Count | Examples |
|----------|-------|----------|
| 📄 **PDF Tools** | 11 | Merge, Split, Compress, Rotate, Watermark, PDF→Images |
| 🖼️ **Image Tools** | 18 | Compress, Resize, Convert, Crop, ASCII Art, Color Palette, Collage |
| 📝 **Text Tools** | 17 | Word Counter, Case Converter, Text-to-Speech, Diff, Stats Analyzer |
| 💻 **Developer Tools** | 28 | JSON Formatter, Regex Tester, CSS Gradient, Flexbox Playground |
| 🔄 **Converters** | 8 | Unit, Number Base, Color, Temperature, Time, Angle |
| 🧮 **Calculators** | 9 | BMI, Age, EMI, Compound Interest, GPA, Scientific |
| 🔍 **SEO & Web** | 7 | Meta Tags, Open Graph, Robots.txt, Sitemap, Keyword Density |
| 🛡️ **Security** | 6 | Password Strength, Hash Generator, Credit Card Validator |
| 🎲 **Miscellaneous** | 10 | QR Code, Barcode, Emoji Picker, Pomodoro, Stopwatch, Invoice |
| 🤖 **AI Tools** | 7 | Image Generator, Content Writer, Chat, OCR, Translator |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (or [Bun](https://bun.sh) runtime)
- **npm**, **yarn**, **pnpm**, or **bun** package manager

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd toolnest

# Install dependencies
bun install
# or: npm install
```

### Development

```bash
# Start the dev server (runs on port 3000)
bun run dev

# Lint the codebase
bun run lint
```

The app will be available at `http://localhost:3000`.

### Build & Production

```bash
# Build for production
bun run build

# Start the production server
bun run start
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com) (New York style) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **State** | React Hooks + localStorage |
| **AI SDK** | [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) (GLM models) |
| **PDF** | [pdf-lib](https://pdf-lib.js.org) + [pdfjs-dist](https://mozilla.github.io/pdf.js/) |
| **Charts** | [Recharts](https://recharts.org) |
| **Markdown** | [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) |

---

## 📁 Project Structure

```
toolnest/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Homepage
│   │   ├── layout.tsx                # Root layout (header, footer, theme)
│   │   ├── globals.css               # Global styles + theme variables
│   │   ├── sitemap.ts                # Dynamic sitemap.xml
│   │   ├── robots.ts                 # Dynamic robots.txt
│   │   ├── browse/
│   │   │   └── page.tsx              # All-tools browse page
│   │   ├── tools/
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Dynamic tool route (+ JSON-LD)
│   │   └── api/
│   │       └── ai/                   # 7 AI API routes (server-side)
│   │           ├── chat-assistant/
│   │           ├── content-writer/
│   │           ├── image-generator/
│   │           ├── image-describer/
│   │           ├── image-ocr/
│   │           ├── summarizer/
│   │           └── translator/
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives (40+ components)
│   │   ├── tools/                    # 121 tool components (one per slug)
│   │   ├── home-page.tsx             # Homepage sections
│   │   ├── browse-page.tsx           # Browse page UI
│   │   ├── tool-loader.tsx           # Lazy-loads tool components (ssr:false)
│   │   ├── tool-page-shell.tsx       # Shared tool layout (FAQ, favorites, etc.)
│   │   ├── site-header.tsx           # Sticky header with search
│   │   ├── site-footer.tsx           # Footer with links
│   │   ├── theme-provider.tsx        # next-themes wrapper
│   │   └── ...
│   ├── hooks/
│   │   ├── use-favorites.ts          # localStorage favorites + recents
│   │   └── use-toast.ts              # Toast hook
│   └── lib/
│       ├── tools-registry.ts         # Central tool metadata (categories, search)
│       ├── utils.ts                  # cn() class merger
│       └── db.ts                     # Prisma client
├── prisma/
│   └── schema.prisma                 # Database schema (SQLite)
├── public/                           # Static assets (logo, pdf.worker)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧩 Architecture

### Tool Registration System

Every tool is defined in **one place** — `src/lib/tools-registry.ts`:

```ts
{ slug: 'pdf-merge', name: 'Merge PDF', description: 'Combine multiple PDF files into one',
  category: 'pdf', popular: true, clientSide: true, keywords: ['combine', 'join', 'pdf'] }
```

This single entry powers:
- The homepage category grid
- The `/browse` page filters
- The search bar
- The dynamic route `/tools/pdf-merge`
- The sitemap.xml entry
- The JSON-LD structured data

### Dynamic Routing

Tool pages use Next.js dynamic routes at `/tools/[slug]`. The `tool-loader.tsx` component lazy-imports each tool component with `{ ssr: false }` to avoid Radix UI hydration mismatches (a known issue when `next/dynamic` SSRs interactive components with `useId()`).

### Client-Side Processing

**114 of 121 tools run 100% in the browser** using:
- **Canvas API** — image manipulation (compress, resize, crop, convert, ASCII art)
- **Web Crypto API** — hashing, password generation, random numbers
- **Web Speech API** — text-to-speech, speech-to-text
- **pdf-lib / pdfjs-dist** — PDF manipulation
- **FileReader / Blob** — file handling without uploads

Only the 7 AI tools require server-side processing (via the `/api/ai/*` routes using the z-ai-web-dev-sdk).

### SEO

- **Sitemap**: auto-generated at `/sitemap.xml` from the tools registry
- **Robots.txt**: served at `/robots.txt` with sitemap reference
- **Per-tool metadata**: OpenGraph, Twitter cards, canonical URLs
- **JSON-LD**: `SoftwareApplication` schema with `offers: { price: 0 }` on every tool page

---

## 🤖 AI Tools

ToolNest includes 7 AI-powered tools backed by GLM models:

| Tool | Endpoint | Description |
|------|----------|-------------|
| AI Image Generator | `POST /api/ai/image-generator` | Text → image (7 sizes, base64 PNG output) |
| AI Content Writer | `POST /api/ai/content-writer` | Articles, emails, social posts |
| AI Chat Assistant | `POST /api/ai/chat-assistant` | Multi-turn conversation |
| AI Image Describer | `POST /api/ai/image-describer` | VLM image description (uses `createVision`) |
| Image OCR | `POST /api/ai/image-ocr` | Extract text from images |
| AI Summarizer | `POST /api/ai/summarizer` | Summarize text + key points |
| AI Translator | `POST /api/ai/translator` | 21 languages + auto-detect |

> **Note**: The z-ai-web-dev-sdk must be used server-side only. AI routes use `runtime = 'nodejs'` and `dynamic = 'force-dynamic'`.

---

## 🎨 Design System

### Color Palette

The theme uses an **emerald/teal primary** (no indigo/blue per brand policy):

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `primary` | Emerald | Emerald | Buttons, links, accents |
| `background` | Off-white | Dark slate | Page background |
| `card` | White | Dark card | Tool cards |
| `muted` | Light gray | Dark muted | Secondary text |
| `accent` | Light emerald | Dark emerald | Hover states |

### Typography

- **Sans-serif**: Geist (loaded via `next/font`)
- **Monospace**: Geist Mono (code blocks, JSON output)

### Layout

- **Max width**: 7xl (1280px) on desktop, full-width mobile
- **Sticky header** with search bar (collapses to hamburger on mobile)
- **Sticky footer** using `min-h-screen flex flex-col` + `mt-auto`
- **Tool cards**: `p-5 sm:p-6` padding, hover lift effect

---

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start dev server on port 3000 |
| `bun run lint` | Run ESLint |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run db:push` | Push Prisma schema to SQLite |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database |

---

## 🔧 Adding a New Tool

1. **Create the tool component** at `src/components/tools/<slug>.tsx`:

```tsx
'use client'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

export default function MyNewTool() {
  const [input, setInput] = React.useState('')
  return (
    <ToolCardWrapper>
      <FieldLabel>Input</FieldLabel>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <Button onClick={() => toast.success('Done!')}>Process</Button>
    </ToolCardWrapper>
  )
}
```

2. **Register the tool** in `src/lib/tools-registry.ts`:

```ts
{ slug: 'my-new-tool', name: 'My New Tool', description: 'Does something useful',
  category: 'text', clientSide: true, keywords: ['new', 'tool'] }
```

3. **Add the dynamic import** in `src/components/tool-loader.tsx`:

```ts
'my-new-tool': dyn(() => import('@/components/tools/my-new-tool')),
```

That's it! The tool now appears on the homepage, browse page, search results, sitemap, and is accessible at `/tools/my-new-tool`.

---

## 🌐 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome / Edge 90+ | ✅ Full | All tools supported |
| Firefox 90+ | ✅ Full | All tools supported |
| Safari 15+ | ✅ Full | All tools supported |
| Mobile Safari | ⚠️ Partial | Some API limitations (Speech Recognition) |
| Older browsers | ⚠️ Partial | WebAssembly + Canvas required |

**Features used**: Web Crypto, Canvas, FileReader, Web Speech, BarcodeDetector, IntersectionObserver, localStorage.

---

## 🔒 Privacy

- **No accounts** — we never ask you to sign up
- **No tracking** — no analytics, no cookies, no fingerprinting
- **No uploads** — 114 of 121 tools process files entirely in your browser
- **AI tools** — your prompts are sent to the GLM API for processing and are not stored after the response is returned

---

## 📜 License

This project is open source and available under the **MIT License**.

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com) — for the excellent component library
- [Lucide](https://lucide.dev) — for the beautiful icons
- [Next.js team](https://nextjs.org) — for the incredible framework

---

<div align="center">

**Built with ❤️ for everyone. Free forever.**

[🌐 Website](https://tool-nest-c.vercel.app) · [📦 GitHub](https://github.com/your-repo) · [💬 Issues](https://github.com/your-repo/issues)

</div>
