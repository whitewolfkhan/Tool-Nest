'use client'

import * as React from 'react'
import { Sparkles, Upload, ImageIcon, X, ScanEye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
  CopyButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_FILE_BYTES = 6 * 1024 * 1024

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Failed to read file'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

interface DescribeResult {
  description: string
  imageUrl: string
}

export default function AiImageDescriber() {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<DescribeResult | null>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined | null) {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please use a PNG, JPEG, WebP, or GIF image.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error('Image is too large. Maximum 6 MB.')
      return
    }
    try {
      const dataUrl = await fileToDataUrl(file)
      setImageUrl(dataUrl)
      setResult(null)
    } catch {
      toast.error('Failed to read the image file.')
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    void handleFile(file)
  }

  async function describe() {
    if (!imageUrl) {
      toast.error('Please upload an image first')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/image-describer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to describe image')
      }
      if (!data?.description) {
        throw new Error('No description returned')
      }
      setResult({ description: data.description, imageUrl })
    } catch (e) {
      toast.error((e as Error).message || 'Failed to describe image')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setImageUrl(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <FieldLabel>Upload an image</FieldLabel>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {!imageUrl ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
            className={
              'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center cursor-pointer transition-colors ' +
              (dragOver
                ? 'border-primary bg-accent'
                : 'border-border hover:border-primary/50 hover:bg-accent/50')
            }
          >
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Drop an image here, or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPEG, WebP, or GIF · up to 6 MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-4 flex-col sm:flex-row">
              <img
                src={imageUrl}
                alt="Uploaded preview"
                className="w-full sm:w-48 h-48 object-cover rounded-md border border-border bg-muted"
              />
              <div className="flex-1 flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Image ready. Click &ldquo;Describe&rdquo; to analyze it.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={describe}
                    disabled={loading}
                    size="lg"
                    className="gap-1.5"
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ScanEye className="h-4 w-4" />
                        Describe image
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={reset}
                    className="gap-1.5"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ToolCardWrapper>

      {loading && (
        <ToolCardWrapper>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Analyzing your image...
            </p>
          </div>
        </ToolCardWrapper>
      )}

      {result && !loading && (
        <ToolCardWrapper>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI description
            </h3>
            <CopyButton text={result.description} />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <img
              src={result.imageUrl}
              alt="Described"
              className="w-full sm:w-40 h-40 object-cover rounded-md border border-border bg-muted shrink-0"
            />
            <Card className="p-4 flex-1 bg-background/50">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {result.description}
              </p>
            </Card>
          </div>
        </ToolCardWrapper>
      )}

      {!result && !loading && !imageUrl && (
        <EmptyState message="Upload an image and the AI will describe what it sees — objects, colors, mood, and more." />
      )}

      {!result && !loading && imageUrl && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
          <ImageIcon className="h-4 w-4" />
          Image loaded — ready to analyze.
        </div>
      )}
    </div>
  )
}
