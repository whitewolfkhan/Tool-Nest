'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  Copy,
  Check,
  Download,
  ArrowLeft,
  Shield,
  Zap,
  Info,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  getToolBySlug,
  getCategoryById,
  getToolsByCategory,
} from '@/lib/tools-registry'
import { FavoriteButton } from '@/components/favorite-button'
import { useRecents } from '@/hooks/use-favorites'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ToolPageShellProps {
  slug: string
  children: React.ReactNode
}

/** Records a visit to this tool slug on mount (for the "recently used" section). */
function VisitRecorder({ slug }: { slug: string }) {
  const { add } = useRecents()
  React.useEffect(() => {
    add(slug)
  }, [slug, add])
  return null
}

export function ToolPageShell({ slug, children }: ToolPageShellProps) {
  const tool = getToolBySlug(slug)
  const router = useRouter()

  if (!tool) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Tool not found</h1>
        <p className="mt-2 text-muted-foreground">The tool you are looking for does not exist.</p>
        <Button onClick={() => router.push('/')} className="mt-4">
          Back to Home
        </Button>
      </div>
    )
  }

  const category = getCategoryById(tool.category)
  const related = getToolsByCategory(tool.category)
    .filter((t) => t.slug !== tool.slug)
    .slice(0, 6)
  const Icon = category?.icon

  const faq = generateFaq(tool.name, tool.description, category?.name ?? 'tools', tool.clientSide)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <VisitRecorder slug={slug} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/browse?cat=${tool.category}`} className="hover:text-foreground">{category?.name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate">{tool.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/" className="hidden sm:flex">
          <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        {Icon && category && (
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
              category.gradient
            )}
          >
            <Icon className={cn('h-6 w-6', category.color)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
            <Badge variant="secondary">{category?.name}</Badge>
            {tool.clientSide && (
              <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                <Shield className="h-3 w-3" />
                100% private
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
        </div>
        <FavoriteButton slug={slug} />
      </div>

      <Separator className="mb-6" />

      {/* Tool content */}
      <div className="mb-10">{children}</div>

      {/* Trust badges row */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TrustBadge
          icon={Shield}
          title="Private by design"
          text={tool.clientSide
            ? 'Runs entirely in your browser. Your data never touches a server.'
            : 'Processed securely on our servers and discarded after use.'}
          color="text-emerald-500"
        />
        <TrustBadge
          icon={Zap}
          title="No signup, no limits"
          text="Use this tool as many times as you want. Forever free, no watermark."
          color="text-amber-500"
        />
        <TrustBadge
          icon={Info}
          title="Works everywhere"
          text="Modern browser is all you need — desktop, tablet, or mobile."
          color="text-cyan-500"
        />
      </div>

      {/* FAQ */}
      <div className="mt-10 border-t border-border pt-8">
        <h2 className="text-lg font-semibold mb-3">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="w-full">
          {faq.map((q, i) => (
            <AccordionItem key={i} value={`q-${i}`}>
              <AccordionTrigger className="text-left text-sm sm:text-base">
                {q.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {q.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Related tools */}
      {related.length > 0 && (
        <div className="mt-10 border-t border-border pt-8">
          <h2 className="text-lg font-semibold mb-3">Related tools</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="text-sm px-3 py-1.5 rounded-md border border-border hover:border-primary/50 hover:bg-accent transition-colors"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TrustBadge({
  icon: Icon,
  title,
  text,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
  color: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{text}</p>
      </div>
    </div>
  )
}

/** Generate a small FAQ specific to the tool. */
function generateFaq(name: string, description: string, category: string, clientSide?: boolean) {
  return [
    {
      q: `Is the ${name} really free?`,
      a: `Yes — ${name} is 100% free with no signup, no watermark, and no limits. Use it as many times as you like.`,
    },
    {
      q: clientSide
        ? `Are my files or data uploaded to a server?`
        : `How is my data handled?`,
      a: clientSide
        ? `No. ${name} runs entirely in your browser using modern web APIs (Canvas, WebAssembly, Web Crypto). Your input never leaves your device — that means total privacy and instant results.`
        : `${name} uses our secure backend API to process your request. We do not store your inputs after the response is returned.`,
    },
    {
      q: `Does ${name} work on mobile?`,
      a: `Yes. All our ${category.toLowerCase()} are designed mobile-first and work on any modern browser — phone, tablet, or desktop.`,
    },
    {
      q: `Do I need to install anything?`,
      a: `No installation required. Just open this page in a modern browser (Chrome, Firefox, Safari, Edge) and you're ready to go.`,
    },
  ]
}

/* Shared utility components for tool pages */

export function CopyButton({
  text,
  className,
  label = 'Copy',
}: {
  text: string
  className?: string
  label?: string
}) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('gap-1.5', className)}
      disabled={!text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          toast.success('Copied to clipboard')
          setTimeout(() => setCopied(false), 2000)
        } catch {
          toast.error('Failed to copy')
        }
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied!' : label}
    </Button>
  )
}

export function DownloadButton({
  onClick,
  disabled,
  className,
  label = 'Download',
}: {
  onClick: () => void
  disabled?: boolean
  className?: string
  label?: string
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="sm"
      className={cn('gap-1.5', className)}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  )
}

export function ToolCardWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn('p-5 sm:p-6', className)}>{children}</Card>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('text-sm font-medium mb-1.5 block', className)}>{children}</label>
  )
}
