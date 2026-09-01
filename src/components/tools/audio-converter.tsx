'use client'

import * as React from 'react'
import {
  Upload,
  Download,
  Music2,
  RefreshCw,
  Loader2,
  Repeat,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  DownloadButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  audioBufferToWav,
  decodeAudioFile,
  formatTime,
  formatFileSize,
  pickSupportedMimeTypes,
} from '@/lib/audio-utils'

type FormatId = 'wav' | 'webm' | 'mp3'

const FORMATS: { id: FormatId; label: string; ext: string; note: string }[] = [
  { id: 'wav', label: 'WAV (16-bit PCM)', ext: 'wav', note: 'Universal, lossless. Always works.' },
  { id: 'webm', label: 'WebM (Opus)', ext: 'webm', note: 'Compressed. Browser-dependent support.' },
  { id: 'mp3', label: 'MP3 (via recorder)', ext: 'mp3', note: 'Only if your browser supports it.' },
]

export default function AudioConverter() {
  const [file, setFile] = React.useState<File | null>(null)
  const [audioBuffer, setAudioBuffer] = React.useState<AudioBuffer | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [outputUrl, setOutputUrl] = React.useState<string>('')
  const [outputSize, setOutputSize] = React.useState<number>(0)
  const [outputExt, setOutputExt] = React.useState<string>('wav')
  const [format, setFormat] = React.useState<FormatId>('wav')
  const [dragOver, setDragOver] = React.useState(false)

  const [mp3Supported, setMp3Supported] = React.useState(false)
  const [webmSupported, setWebmSupported] = React.useState(false)

  React.useEffect(() => {
    setMp3Supported(!!pickSupportedMimeTypes(['audio/mpeg']))
    setWebmSupported(!!pickSupportedMimeTypes(['audio/webm;codecs=opus', 'audio/webm']))
  }, [])

  React.useEffect(() => {
    return () => {
      if (outputUrl) URL.revokeObjectURL(outputUrl)
    }
  }, [outputUrl])

  async function loadFile(f: File) {
    setLoading(true)
    setOutputUrl('')
    setOutputSize(0)
    try {
      const buf = await decodeAudioFile(f)
      setFile(f)
      setAudioBuffer(buf)
      toast.success('Audio loaded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to decode audio. Try a different file.')
    } finally {
      setLoading(false)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) loadFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('audio/')) loadFile(f)
    else toast.error('Please drop an audio file')
  }

  async function handleConvert() {
    if (!audioBuffer) return
    setProcessing(true)
    try {
      if (format === 'wav') {
        const blob = audioBufferToWav(audioBuffer)
        if (outputUrl) URL.revokeObjectURL(outputUrl)
        setOutputUrl(URL.createObjectURL(blob))
        setOutputSize(blob.size)
        setOutputExt('wav')
        toast.success(`Converted to WAV (${formatFileSize(blob.size)})`)
      } else {
        // Use MediaRecorder via OfflineAudioContext-rendered buffer → play through a graph
        // that MediaRecorder can capture. Simpler: render the buffer to a WAV, then play
        // it through a capture stream. We'll use the audioBuffer directly via AudioBufferSourceNode.
        const mimeType = format === 'mp3'
          ? pickSupportedMimeTypes(['audio/mpeg', 'audio/mp3']) ?? ''
          : pickSupportedMimeTypes(['audio/webm;codecs=opus', 'audio/webm']) ?? ''
        if (!mimeType) {
          toast.error(
            format === 'mp3'
              ? 'Your browser cannot record MP3. Please choose WAV instead.'
              : 'Your browser cannot record WebM audio.'
          )
          setProcessing(false)
          return
        }

        const blob = await recordAudioBuffer(audioBuffer, mimeType)
        if (outputUrl) URL.revokeObjectURL(outputUrl)
        setOutputUrl(URL.createObjectURL(blob))
        setOutputSize(blob.size)
        setOutputExt(format === 'mp3' ? 'mp3' : 'webm')
        toast.success(`Converted to ${format.toUpperCase()} (${formatFileSize(blob.size)})`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Conversion failed')
    } finally {
      setProcessing(false)
    }
  }

  function reset() {
    setFile(null)
    setAudioBuffer(null)
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setOutputUrl('')
    setOutputSize(0)
  }

  function downloadOutput() {
    if (!outputUrl) return
    const a = document.createElement('a')
    a.href = outputUrl
    const baseName = file?.name.replace(/\.[^.]+$/, '') || 'audio'
    a.download = `${baseName}-converted.${outputExt}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Download started')
  }

  const currentFormat = FORMATS.find((f) => f.id === format)

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 px-4 text-center transition-colors',
              dragOver
                ? 'border-fuchsia-500 bg-fuchsia-500/5'
                : 'border-border hover:border-fuchsia-500/50'
            )}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-fuchsia-500/10 mb-3">
              {loading ? (
                <Loader2 className="h-7 w-7 animate-spin text-fuchsia-500" />
              ) : (
                <Upload className="h-7 w-7 text-fuchsia-500" />
              )}
            </div>
            <p className="text-base font-medium">
              {loading ? 'Decoding audio…' : 'Drop your audio file here'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports MP3, WAV, OGG, M4A, FLAC — 100% in your browser
            </p>
            <label className="mt-4 cursor-pointer">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileInput}
                className="sr-only"
              />
              <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Upload className="h-4 w-4" />
                Choose Audio File
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-500/10 shrink-0">
                  <Music2 className="h-5 w-5 text-fuchsia-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate max-w-[260px] sm:max-w-md">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} · {formatTime(audioBuffer?.duration ?? 0)} ·{' '}
                    {audioBuffer?.sampleRate.toLocaleString()} Hz ·{' '}
                    {file.type || 'unknown'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                <RefreshCw className="h-4 w-4" />
                New file
              </Button>
            </div>

            <div>
              <FieldLabel>Convert to</FieldLabel>
              <Select value={format} onValueChange={(v) => setFormat(v as FormatId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem
                      key={f.id}
                      value={f.id}
                      disabled={f.id === 'mp3' ? !mp3Supported : f.id === 'webm' ? !webmSupported : false}
                    >
                      {f.label}
                      {f.id === 'mp3' && !mp3Supported && ' (unsupported)'}
                      {f.id === 'webm' && !webmSupported && ' (unsupported)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentFormat && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {currentFormat.note}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleConvert}
                disabled={processing}
                className="gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
                {processing ? 'Converting…' : 'Convert audio'}
              </Button>
              {outputUrl && (
                <DownloadButton
                  onClick={downloadOutput}
                  label={`Download .${outputExt} (${formatFileSize(outputSize)})`}
                />
              )}
            </div>

            {outputUrl && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-xs text-muted-foreground mb-1">Preview converted audio</p>
                <audio src={outputUrl} controls className="w-full" />
              </div>
            )}
          </div>
        )}
        {!file && (
          <div className="mt-4">
            <EmptyState message="Upload an audio file to start converting." />
          </div>
        )}
      </ToolCardWrapper>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">About browser audio encoding</p>
        <p>
          Browsers cannot natively encode MP3 — they can only decode it. For reliable conversion,
          choose <strong>WAV</strong> (lossless, universal). For WebM/Opus or MP3, we use the
          MediaRecorder API to capture playback in real time, which depends on your browser's
          supported codecs.
        </p>
      </div>
    </div>
  )
}

/**
 * Play an AudioBuffer through a MediaStreamDestination + MediaRecorder in real time.
 * This lets us produce compressed formats (WebM/Opus, MP3 if supported) from any decoded audio.
 */
function recordAudioBuffer(buffer: AudioBuffer, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const dest = ctx.createMediaStreamDestination()
    src.connect(dest)
    // Also connect to speakers? No — keep it silent to avoid double audio.

    const chunks: BlobPart[] = []
    const recorder = new MediaRecorder(dest.stream, mimeType ? { mimeType } : undefined)
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.onerror = (e) => {
      ctx.close().catch(() => {})
      reject(e)
    }
    recorder.onstop = () => {
      ctx.close().catch(() => {})
      resolve(new Blob(chunks, { type: mimeType }))
    }
    src.onended = () => {
      if (recorder.state !== 'inactive') recorder.stop()
    }
    recorder.start()
    src.start(0)
  })
}
