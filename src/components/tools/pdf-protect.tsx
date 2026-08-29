'use client'

import * as React from 'react'
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import {
  Upload,
  FileText,
  Download,
  Loader2,
  X,
  Shield,
  ShieldAlert,
  Lock,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function PdfProtect() {
  const [file, setFile] = React.useState<File | null>(null)
  const [pageCount, setPageCount] = React.useState(0)
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [showPass, setShowPass] = React.useState(false)
  const [stampOpacity, setStampOpacity] = React.useState(15)
  const [addVisibleStamp, setAddVisibleStamp] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const loadFile = async (f: File) => {
    if (f.type !== 'application/pdf') {
      toast.error('Please select a PDF file')
      return
    }
    try {
      const buf = await f.arrayBuffer()
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
      setFile(f)
      setPageCount(doc.getPageCount())
    } catch (err) {
      console.error(err)
      toast.error('Failed to read PDF.')
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) loadFile(f)
  }

  const reset = () => {
    setFile(null)
    setPageCount(0)
  }

  const strength = React.useMemo(() => {
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return Math.min(score, 4)
  }, [password])

  const strengthLabel = ['Empty', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = [
    'bg-muted',
    'bg-red-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-emerald-500',
  ][strength]

  const canApply = !!file && password.length >= 1 && password === confirm

  const apply = async () => {
    if (!file) return
    if (!password) {
      toast.error('Please enter a password')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })

      // Compute password hash for metadata (so the protection can be verified later).
      const hash = await sha256Hex(password)

      // Add metadata marking the document as restricted.
      doc.setProducer('ToolNest PDF Restrict')
      doc.setCreator('ToolNest PDF Restrict')
      doc.setSubject('[RESTRICTED] Password-protected marker')
      doc.setKeywords(['toolnest-protected', 'restricted', `pw-hash:${hash}`])
      try {
        doc.setCustomMetadata('X-ToolNest-Protected', 'true')
        doc.setCustomMetadata('X-ToolNest-PasswordHash', hash)
        doc.setCustomMetadata('X-ToolNest-ProtectedAt', new Date().toISOString())
      } catch {
        /* setCustomMetadata may not exist in all pdf-lib versions */
      }

      // Optionally add a visible "PROTECTED" stamp on every page (does NOT show the password).
      if (addVisibleStamp) {
        const font = await doc.embedFont(StandardFonts.HelveticaBold)
        const op = stampOpacity / 100
        const stampText = 'PROTECTED'
        const size = 60
        const tw = font.widthOfTextAtSize(stampText, size)
        doc.getPages().forEach((page) => {
          const { width, height } = page.getSize()
          page.drawText(stampText, {
            x: (width - tw) / 2,
            y: height / 2 - size / 2,
            size,
            font,
            color: rgb(0.8, 0.2, 0.2),
            opacity: op,
            rotate: degrees(45),
          })
        })
      }

      const bytes = await doc.save()
      download(
        new Blob([bytes as BlobPart], { type: 'application/pdf' }),
        file.name.replace(/\.pdf$/i, '') + '_restricted.pdf',
      )
      toast.success('Restriction marker applied. See notice below.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to apply restriction')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolCardWrapper>
      {/* Important notice */}
      <div className="mb-5 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              Limitation notice
            </p>
            <p className="mt-1 text-amber-800 dark:text-amber-300/90">
              Browser-based <code className="rounded bg-amber-500/10 px-1">pdf-lib</code> cannot
              perform true PDF encryption (RC4/AES). This tool applies a{' '}
              <strong>restriction marker</strong>: it stores a SHA-256 hash of your password
              in document metadata and optionally stamps a visible <em>PROTECTED</em> watermark
              on every page. <strong>This is not real encryption</strong> — the file remains
              viewable. For genuine password encryption, use Adobe Acrobat, qpdf, or a
              server-side library.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <FieldLabel>Source PDF</FieldLabel>
          {!file ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-12 text-center transition-colors',
                dragging
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-border hover:border-emerald-500/60 hover:bg-accent/40'
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <Upload className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium">Drop a PDF here or click to upload</p>
              <p className="text-xs text-muted-foreground">Single PDF file</p>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) loadFile(f)
                  e.target.value = ''
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-rose-500/10">
                <FileText className="h-5 w-5 text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pageCount} pages · {formatSize(file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={reset}
                disabled={busy}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {file && (
            <>
              <div>
                <FieldLabel>Password</FieldLabel>
                <div className="relative">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={busy}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex h-1.5 flex-1 gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-full flex-1 rounded-full transition-colors',
                            i < strength ? strengthColor : 'bg-muted'
                          )}
                        />
                      ))}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {strengthLabel}
                    </Badge>
                  </div>
                )}
              </div>
              <div>
                <FieldLabel>Confirm password</FieldLabel>
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  disabled={busy}
                  aria-invalid={confirm.length > 0 && password !== confirm}
                />
                {confirm.length > 0 && password !== confirm && (
                  <p className="mt-1 text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <FieldLabel>Options</FieldLabel>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm font-medium">Visible "PROTECTED" stamp</p>
                <p className="text-xs text-muted-foreground">
                  Adds a translucent diagonal stamp on every page (does not show the password).
                </p>
              </div>
              <input
                type="checkbox"
                checked={addVisibleStamp}
                onChange={(e) => setAddVisibleStamp(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-emerald-600"
              />
            </label>
            {addVisibleStamp && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-medium">Stamp opacity</Label>
                  <Badge variant="secondary">{stampOpacity}%</Badge>
                </div>
                <Slider
                  min={5}
                  max={50}
                  value={[stampOpacity]}
                  onValueChange={(v) => setStampOpacity(v[0])}
                  disabled={!addVisibleStamp}
                />
              </div>
            )}
          </div>

          <Separator />

          <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Info className="h-4 w-4 text-emerald-600" /> What gets applied
            </p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                SHA-256 hash of password stored in document metadata keywords.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                Producer/Creator metadata set to a restricted marker.
              </li>
              {addVisibleStamp && (
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                  Translucent <code className="rounded bg-muted px-1">PROTECTED</code> stamp on every page.
                </li>
              )}
            </ul>
          </div>

          <Button
            onClick={apply}
            disabled={busy || !canApply}
            className="w-full gap-2"
            size="lg"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {busy ? 'Processing...' : 'Apply Restriction & Download'}
          </Button>
          {file && !canApply && (
            <p className="text-center text-xs text-muted-foreground">
              Enter and confirm a password to continue
            </p>
          )}

          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              For real encryption, consider desktop tools like qpdf, Adobe Acrobat, or a
              server-side library that supports PDF AES/RC4 encryption.
            </span>
          </div>
        </div>
      </div>
    </ToolCardWrapper>
  )
}
