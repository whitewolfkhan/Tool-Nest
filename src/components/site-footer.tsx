import Link from 'next/link'
import { Wrench, Github, Mail, BookOpen } from 'lucide-react'
import { categories, totalToolsCount, getToolBySlug } from '@/lib/tools-registry'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          {/* Brand column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wrench className="h-4 w-4" />
              </div>
              <span className="text-base font-bold">ToolNest</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Free online tools for everyone. {totalToolsCount}+ tools across {categories.length} categories — no signup, no watermark, all in your browser.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://github.com/whitewolfkhan"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://dev.to/meheer_khan"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
                aria-label="Blog (dev.to)"
              >
                <BookOpen className="h-4 w-4" />
              </a>
              <a
                href="mailto:meheercsecu@gmail.com"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Top categories */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Top Tools</h3>
            <ul className="space-y-2 text-sm">
              {['pdf-merge', 'image-compress', 'word-counter', 'json-formatter', 'qr-code-generator'].map((slug) => {
                const t = getToolBySlug(slug)
                return (
                  <li key={slug}>
                    <Link
                      href={`/tools/${slug}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t?.name ?? slug}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Categories</h3>
            <ul className="space-y-2 text-sm">
              {categories.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/#${c.id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ToolNest. All tools run in your browser.</p>
          <p>
            Developed by{' '}
            <a
              href="https://meheerali.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              White-Wolf
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
