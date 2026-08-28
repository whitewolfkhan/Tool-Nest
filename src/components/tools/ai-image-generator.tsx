'use client'

import * as React from 'react'
import { Sparkles, Download, Trash2, RefreshCw, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
  CopyButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

type Size = '512x512' | '1024x1024'

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  size: Size
}

const EXAMPLE_PROMPTS = [
  'A serene Japanese garden with cherry blossoms, koi pond, soft morning light, photorealistic',
  'Cute robot barista serving latte art in a cozy futuristic cafe, pastel colors, 3D render',
  'Majestic snow-capped mountain at golden hour, alpine lake reflection, cinematic landscape',
  'Abstract gradient wallpaper, emerald and teal flowing waves, minimal, high resolution',
]

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}

async function downloadImage(url: string, fallbackName: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `${fallbackName}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    toast.error('Failed to download image')
  }
}

export default function AiImageGenerator() {
  const [prompt, setPrompt] = React.useState('')
  const [size, setSize] = React.useState<Size>('1024x1024')
  const [loading, setLoading] = React.useState(false)
  const [images, setImages] = React.useState<GeneratedImage[]>([])
  const [gallery, setGallery] = React.useState<GeneratedImage[]>([])

  const examplesRef = React.useRef<HTMLDivElement>(null)

  async function generate() {
    const trimmed = prompt.trim()
    if (!trimmed) {
      toast.error('Please describe the image you want')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/ai/image-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, size, n: 1 }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to generate image')
      }
      const next: GeneratedImage[] = (data.images ?? [])
        .filter((i: { url?: string }) => !!i?.url)
        .map((i: { url: string }) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url: i.url,
          prompt: trimmed,
          size,
        }))
      if (!next.length) {
        throw new Error('No images returned')
      }
      setImages((prev) => [...next, ...prev])
      toast.success('Image generated')
    } catch (e) {
      toast.error((e as Error).message || 'Failed to generate image')
    } finally {
      setLoading(false)
    }
  }

  function applyExample(text: string) {
    setPrompt(text)
  }

  function saveToGallery(img: GeneratedImage) {
    setGallery((prev) =>
      prev.find((g) => g.url === img.url) ? prev : [img, ...prev]
    )
    toast.success('Saved to gallery')
  }

  function removeFromGallery(id: string) {
    setGallery((prev) => prev.filter((g) => g.id !== id))
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <FieldLabel>Describe your image</FieldLabel>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A serene forest glade with dappled sunlight, fireflies, mystical atmosphere..."
          rows={4}
          maxLength={1000}
          disabled={loading}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{prompt.length}/1000</span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Image size</FieldLabel>
            <Select value={size} onValueChange={(v) => setSize(v as Size)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="512x512">512 × 512 (square, fast)</SelectItem>
                <SelectItem value="1024x1024">1024 × 1024 (square, HD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={generate}
              disabled={loading || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </ToolCardWrapper>

      {!images.length && !loading && (
        <ToolCardWrapper>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Need inspiration? Try one of these:</h3>
          </div>
          <div ref={examplesRef} className="grid gap-2 sm:grid-cols-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => applyExample(p)}
                className="text-left rounded-md border border-border p-3 text-sm hover:border-primary/50 hover:bg-accent transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </ToolCardWrapper>
      )}

      {loading && (
        <ToolCardWrapper>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Generating your image... this usually takes a few seconds.
            </p>
          </div>
        </ToolCardWrapper>
      )}

      {images.length > 0 && (
        <ToolCardWrapper>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold">Generated images</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImages([])}
              className="gap-1.5 text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((img) => (
              <Card key={img.id} className="overflow-hidden p-0">
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="w-full aspect-square object-cover bg-muted"
                />
                <div className="p-3 space-y-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {img.prompt}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{img.size}</Badge>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => downloadImage(img.url, 'toolnest-ai-image')}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5"
                      onClick={() => saveToGallery(img)}
                    >
                      Save to gallery
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ToolCardWrapper>
      )}

      {gallery.length > 0 && (
        <ToolCardWrapper>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Your gallery ({gallery.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGallery([])}
              className="gap-1.5 text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
              Clear gallery
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {gallery.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="w-full aspect-square object-cover rounded-md border border-border bg-muted"
                />
                <button
                  onClick={() => removeFromGallery(img.id)}
                  className="absolute top-1.5 right-1.5 rounded-md bg-background/90 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  aria-label="Remove from gallery"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
                <button
                  onClick={() => downloadImage(img.url, 'toolnest-ai-image')}
                  className="absolute bottom-1.5 right-1.5 rounded-md bg-background/90 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  aria-label="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </ToolCardWrapper>
      )}

      {!images.length && !loading && !gallery.length && (
        <EmptyState message="Your generated images will appear here. Try a prompt above to get started." />
      )}
    </div>
  )
}
