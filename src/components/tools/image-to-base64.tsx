'use client'

import * as React from 'react'
import { Upload, X, ImageIcon, ArrowLeftRight, Image as ImageLucide } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel, CopyButton } from '@/components/tool-page-shell'
import { toast } from 'sonner'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)))
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

export default function ImageToBase64() {
  const [file, setFile] = React.useState<File | null>(null)
  const [imageUrl, setImageUrl] = React.useState<string>('')
  const [base64, setBase64] = React.useState<string>('')
  const [origW, setOrigW] = React.useState(0)
  const [origH, setOrigH] = React.useState(0)
  const [inputBase64, setInputBase64] = React.useState<string>('')
  const [decodedUrl, setDecodedUrl] = React.useState<string>('')
  const [decodedError, setDecodedError] = React.useState<string>('')
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    setFile(f)
    const url = URL.createObjectURL(f)
    setImageUrl(url)
    setBase64('')
    const reader = new FileReader()
    reader.onload = () => {
      setBase64(reader.result as string)
    }
    reader.onerror = () => toast.error('Failed to read file')
    reader.readAsDataURL(f)
    const img = new Image()
    img.onload = () => {
      setOrigW(img.naturalWidth)
      setOrigH(img.naturalHeight)
    }
    img.src = url
  }

  React.useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
      if (decodedUrl && decodedUrl.startsWith('blob:')) URL.revokeObjectURL(decodedUrl)
    }
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const reset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setFile(null)
    setImageUrl('')
    setBase64('')
    setOrigW(0)
    setOrigH(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  const tryDecode = () => {
    setDecodedError('')
    if (decodedUrl && decodedUrl.startsWith('blob:')) URL.revokeObjectURL(decodedUrl)
    setDecodedUrl('')
    const trimmed = inputBase64.trim()
    if (!trimmed) {
      setDecodedError('Please paste a Base64 string')
      return
    }
    let src = trimmed
    // Auto-prepend data URI prefix if missing
    if (!src.startsWith('data:')) {
      // Try to detect format from content
      src = `data:image/png;base64,${src.replace(/^data:image\/\w+;base64,/, '')}`
    }
    const img = new Image()
    img.onload = () => {
      setDecodedUrl(src)
      toast.success('Base64 decoded successfully')
    }
    img.onerror = () => {
      setDecodedError('Invalid Base64 image data')
      toast.error('Could not decode Base64 image')
    }
    img.src = src
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolCardWrapper>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Image to Base64</h2>
            {file && (
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                <X className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
          {!file ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-12 px-4 cursor-pointer transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drag & drop image here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse · JPG, PNG, WebP</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
                <img src={imageUrl} alt="Source" className="w-full h-auto max-h-60 object-contain" />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <ImageIcon className="h-3.5 w-3.5" /> {file.name}
                </span>
                <span className="shrink-0">
                  {origW}×{origH} · {formatBytes(file.size)}
                </span>
              </div>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Base64 Output</h2>
          {base64 ? (
            <div className="space-y-3">
              <FieldLabel>Data URI</FieldLabel>
              <Textarea
                value={base64}
                readOnly
                className="font-mono text-xs resize-none h-44 max-h-60"
                onClick={(e) => e.currentTarget.select()}
              />
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary">{formatBytes(base64.length)}</Badge>
                <CopyButton text={base64} label="Copy Base64" />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Upload an image to generate its Base64 string
            </div>
          )}

          <div className="border-t border-border pt-4">
            <Tabs defaultValue="decode">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <ArrowLeftRight className="h-4 w-4" /> Base64 to Image
                </h3>
                <TabsList>
                  <TabsTrigger value="decode">Decode</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="decode" className="space-y-3 mt-3">
                <FieldLabel>Paste Base64 string</FieldLabel>
                <Textarea
                  value={inputBase64}
                  onChange={(e) => setInputBase64(e.target.value)}
                  placeholder="data:image/png;base64,..."
                  className="font-mono text-xs resize-none h-28"
                />
                <Button onClick={tryDecode} disabled={!inputBase64.trim()}>
                  <ImageLucide className="h-4 w-4" /> Decode
                </Button>
                {decodedError && (
                  <p className="text-xs text-destructive">{decodedError}</p>
                )}
                {decodedUrl && (
                  <div className="space-y-2">
                    <FieldLabel>Decoded preview</FieldLabel>
                    <div className="rounded-lg border border-border overflow-hidden bg-muted/30 p-2">
                      <img src={decodedUrl} alt="Decoded" className="max-w-full h-auto max-h-52 object-contain mx-auto" />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ToolCardWrapper>
    </div>
  )
}
