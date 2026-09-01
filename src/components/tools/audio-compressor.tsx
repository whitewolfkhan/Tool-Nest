'use client'

import * as React from 'react'
import {
  Upload,
  Download,
  Music2,
  RefreshCw,
  Loader2,
  TrendingDown,
  Gauge,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
} from '@/lib/audio-utils'

const SAMPLE_RATES = [
  { value: '44100', label: '44100 Hz (CD quality)' },
  { value: '22050', label: '22050 Hz (FM radio)' },
  { value: '16000', label: '16000 Hz (Voice)' },
  { value: '11025', label: '11025 Hz (Low voice)' },
  { value: '8000', label: '8000 Hz (Telephone)' },
]

export default function AudioCompressor() {
  const [file, setFile] = React.useState<File | null>(null)
  const [audioBuffer, setAudioBuffer] = React.useState<AudioBuffer | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [outputUrl, setOutputUrl] = React.useState<string>('')
  const [outputSize, setOutputSize] = React.useState<number>(0)
  const [sampleRate, setSampleRate] = React.useState('22050')
  const [mono, setMono] = React.useState(true)
  const [dragOver, setDragOver] = React.useState(false)

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
      // Default sample rate: pick first SR lower than the source
      const candidates = ['22050', '16000', '11025', '8000']
      const matching = candidates.find((sr) => Number(sr) < buf.sampleRate) ?? '22050'
      setSampleRate(matching)
      setMono(buf.numberOfChannels > 1)
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

  // Estimated compressed size based on chosen settings (16-bit WAV)
  const estimatedSize = React.useMemo(() => {
    if (!audioBuffer) return 0
    const newRate = Number(sampleRate)
    const newChannels = mono ? 1 : audioBuffer.numberOfChannels
    const newLength = Math.round(audioBuffer.length * (newRate / audioBuffer.sampleRate))
    return 44 + newLength * newChannels * 2
  }, [audioBuffer, sampleRate, mono])

  const savings = file && estimatedSize > 0
    ? Math.max(0, Math.round((1 - estimatedSize / file.size) * 100))
    : 0

  async function handleCompress() {
    if (!audioBuffer) return
    setProcessing(true)
    try {
      const targetRate = Number(sampleRate)
      const targetChannels = mono ? 1 : audioBuffer.numberOfChannels
      const newLength = Math.round(
        audioBuffer.length * (targetRate / audioBuffer.sampleRate)
      )

      const OfflineAudioCtx =
        window.OfflineAudioContext ||
        (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
          .webkitOfflineAudioContext

      const offline = new OfflineAudioCtx(targetChannels, newLength, targetRate)
      const src = offline.createBufferSource()
      src.buffer = audioBuffer
      src.connect(offline.destination)
      src.start(0)
      const rendered = await offline.startRendering()

      const blob = audioBufferToWav(rendered)
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      const url = URL.createObjectURL(blob)
      setOutputUrl(url)
      setOutputSize(blob.size)
      toast.success(`Compressed to ${formatFileSize(blob.size)} (${savings}% smaller)`)
    } catch (err) {
      console.error(err)
      toast.error('Compression failed')
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
    a.download = `${baseName}-compressed.wav`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Download started')
  }

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
                    {audioBuffer?.numberOfChannels === 1 ? 'Mono' : 'Stereo'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                <RefreshCw className="h-4 w-4" />
                New file
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Target sample rate</FieldLabel>
                <Select value={sampleRate} onValueChange={setSampleRate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_RATES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>Channels</FieldLabel>
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-sm">{mono ? 'Mono (1 ch)' : `Original (${audioBuffer?.numberOfChannels} ch)`}</span>
                  <Switch checked={mono} onCheckedChange={setMono} />
                </div>
              </div>
            </div>

            {/* Size comparison */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-card/50 p-3">
                <p className="text-xs text-muted-foreground">Original size</p>
                <p className="text-lg font-semibold">{formatFileSize(file.size)}</p>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-3">
                <p className="text-xs text-muted-foreground">Estimated output</p>
                <p className="text-lg font-semibold text-fuchsia-600">
                  {formatFileSize(estimatedSize)}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Savings
                </p>
                <p className="text-lg font-semibold text-emerald-600">{savings}%</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleCompress}
                disabled={processing}
                className="gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gauge className="h-4 w-4" />
                )}
                {processing ? 'Compressing…' : 'Compress audio'}
              </Button>
              {outputUrl && (
                <>
                  <DownloadButton
                    onClick={downloadOutput}
                    label={`Download WAV (${formatFileSize(outputSize)})`}
                  />
                  <Badge variant="outline" className="text-emerald-600">
                    {savings}% smaller
                  </Badge>
                </>
              )}
            </div>

            {outputUrl && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-xs text-muted-foreground mb-1">Preview compressed audio</p>
                <audio src={outputUrl} controls className="w-full" />
              </div>
            )}
          </div>
        )}
        {!file && (
          <div className="mt-4">
            <EmptyState message="Upload an audio file to start compressing." />
          </div>
        )}
      </ToolCardWrapper>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How compression works</p>
        <p>
          We re-render your audio through an <code>OfflineAudioContext</code> at a lower sample
          rate and (optionally) convert it to mono. The output is encoded as a 16-bit PCM WAV
          file. Lowering the sample rate reduces treble detail — for speech, 16000 Hz mono is a
          great balance of size and intelligibility.
        </p>
      </div>
    </div>
  )
}
