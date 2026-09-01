'use client'

import * as React from 'react'
import {
  Upload,
  Download,
  Music2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Combine,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
  DownloadButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  audioBufferToWav,
  decodeAudioFile,
  formatTime,
  formatFileSize,
  concatenateAudioBuffers,
} from '@/lib/audio-utils'

interface AudioItem {
  id: string
  file: File
  buffer: AudioBuffer | null
  loading: boolean
  error?: boolean
}

const uid = () => Math.random().toString(36).slice(2, 9)

export default function AudioMerger() {
  const [items, setItems] = React.useState<AudioItem[]>([])
  const [processing, setProcessing] = React.useState(false)
  const [outputUrl, setOutputUrl] = React.useState<string>('')
  const [outputSize, setOutputSize] = React.useState<number>(0)
  const [dragOver, setDragOver] = React.useState(false)

  React.useEffect(() => {
    return () => {
      if (outputUrl) URL.revokeObjectURL(outputUrl)
    }
  }, [outputUrl])

  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('audio/'))
    if (arr.length === 0) {
      toast.error('Please drop audio files')
      return
    }
    const newItems: AudioItem[] = arr.map((f) => ({
      id: uid(),
      file: f,
      buffer: null,
      loading: true,
    }))
    setItems((prev) => [...prev, ...newItems])

    // Decode each in parallel
    await Promise.all(
      newItems.map(async (item) => {
        try {
          const buf = await decodeAudioFile(item.file)
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, buffer: buf, loading: false } : it
            )
          )
        } catch (err) {
          console.error(err)
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, loading: false, error: true } : it
            )
          )
        }
      })
    )
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  function move(id: string, dir: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      if (idx === -1) return prev
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
      return copy
    })
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const validItems = items.filter((i) => i.buffer && !i.error)
  const totalDuration = validItems.reduce((sum, i) => sum + (i.buffer?.duration ?? 0), 0)
  const totalSize = validItems.reduce((sum, i) => sum + i.file.size, 0)
  const canMerge = validItems.length >= 2 && validItems.every((i) => !i.loading)

  async function handleMerge() {
    if (!canMerge) {
      toast.error('Need at least 2 decoded audio files')
      return
    }
    setProcessing(true)
    try {
      const buffers = validItems
        .map((i) => i.buffer!)
        .filter((b): b is AudioBuffer => !!b)
      const merged = concatenateAudioBuffers(buffers)
      const blob = audioBufferToWav(merged)
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      setOutputUrl(URL.createObjectURL(blob))
      setOutputSize(blob.size)
      toast.success(`Merged ${buffers.length} files (${formatFileSize(blob.size)})`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to merge audio')
    } finally {
      setProcessing(false)
    }
  }

  function downloadOutput() {
    if (!outputUrl) return
    const a = document.createElement('a')
    a.href = outputUrl
    a.download = 'merged-audio.wav'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Download started')
  }

  function clearAll() {
    setItems([])
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setOutputUrl('')
    setOutputSize(0)
  }

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 px-4 text-center transition-colors',
            dragOver
              ? 'border-fuchsia-500 bg-fuchsia-500/5'
              : 'border-border hover:border-fuchsia-500/50'
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fuchsia-500/10 mb-2">
            <Upload className="h-6 w-6 text-fuchsia-500" />
          </div>
          <p className="text-base font-medium">Drop audio files to merge</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add 2 or more — reorder with the arrows. MP3, WAV, OGG, M4A supported.
          </p>
          <label className="mt-3 cursor-pointer">
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileInput}
              className="sr-only"
            />
            <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add audio files
            </span>
          </label>
        </div>

        {/* List */}
        {items.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel className="mb-0">
                Files ({items.length}) · Total {formatTime(totalDuration)} ·{' '}
                {formatFileSize(totalSize)}
              </FieldLabel>
              <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5">
                <Trash2 className="h-4 w-4" /> Clear all
              </Button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3',
                    item.error
                      ? 'border-red-500/40 bg-red-500/5'
                      : 'border-border bg-card/50'
                  )}
                >
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => move(item.id, -1)}
                      disabled={idx === 0}
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => move(item.id, 1)}
                      disabled={idx === items.length - 1}
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-fuchsia-500/10 shrink-0 text-xs font-medium text-fuchsia-600">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate text-sm">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.loading ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Decoding…
                        </span>
                      ) : item.error ? (
                        <span className="text-red-500">Failed to decode</span>
                      ) : item.buffer ? (
                        <>
                          {formatTime(item.buffer.duration)} ·{' '}
                          {formatFileSize(item.file.size)} ·{' '}
                          {item.buffer.sampleRate.toLocaleString()} Hz
                        </>
                      ) : null}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Merge action */}
        {items.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleMerge}
              disabled={!canMerge || processing}
              className="gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-700"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Combine className="h-4 w-4" />
              )}
              {processing ? 'Merging…' : `Merge ${validItems.length} files`}
            </Button>
            {outputUrl && (
              <>
                <DownloadButton
                  onClick={downloadOutput}
                  label={`Download WAV (${formatFileSize(outputSize)})`}
                />
                <Badge variant="outline" className="text-emerald-600">
                  {formatTime(totalDuration)} merged
                </Badge>
              </>
            )}
          </div>
        )}

        {outputUrl && (
          <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="text-xs text-muted-foreground mb-1">Preview merged audio</p>
            <audio src={outputUrl} controls className="w-full" />
          </div>
        )}

        {items.length === 0 && (
          <div className="mt-4">
            <EmptyState message="Add at least 2 audio files to merge them into one." />
          </div>
        )}
      </ToolCardWrapper>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How merging works</p>
        <p>
          Each file is decoded with the Web Audio API, then the audio buffers are concatenated
          (in order) and re-encoded as a 16-bit PCM WAV. Files at different sample rates are
          resampled to match the first file. Channels are padded with silence when they differ.
        </p>
      </div>
    </div>
  )
}
