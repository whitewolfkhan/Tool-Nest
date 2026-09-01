'use client'

import * as React from 'react'
import {
  Upload,
  Download,
  Music2,
  RefreshCw,
  Loader2,
  Volume2,
  Play,
  Pause,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
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

export default function AudioVolumeBooster() {
  const [file, setFile] = React.useState<File | null>(null)
  const [audioBuffer, setAudioBuffer] = React.useState<AudioBuffer | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [outputUrl, setOutputUrl] = React.useState<string>('')
  const [outputSize, setOutputSize] = React.useState<number>(0)
  const [gain, setGain] = React.useState(2) // multiplier 0..4
  const [previewUrl, setPreviewUrl] = React.useState<string>('')
  const [isPreviewPlaying, setIsPreviewPlaying] = React.useState(false)
  const [dragOver, setDragOver] = React.useState(false)

  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null)

  React.useEffect(() => {
    return () => {
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [outputUrl, previewUrl])

  async function loadFile(f: File) {
    setLoading(true)
    setOutputUrl('')
    setOutputSize(0)
    setPreviewUrl('')
    try {
      const buf = await decodeAudioFile(f)
      setFile(f)
      setAudioBuffer(buf)
      await regeneratePreview(buf, gain)
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

  // Regenerate preview when gain changes (debounced via timeout)
  React.useEffect(() => {
    if (!audioBuffer) return
    const id = setTimeout(async () => {
      try {
        await regeneratePreview(audioBuffer, gain)
      } catch (err) {
        console.error(err)
      }
    }, 250)
    return () => clearTimeout(id)
  }, [gain, audioBuffer])

  async function regeneratePreview(buffer: AudioBuffer, gainMult: number) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    // Render a short preview (up to 10 seconds) so the user can hear the gain change
    const previewDuration = Math.min(10, buffer.duration)
    const newLength = Math.floor(buffer.sampleRate * previewDuration)

    const OfflineAudioCtx =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
        .webkitOfflineAudioContext

    const offline = new OfflineAudioCtx(
      buffer.numberOfChannels,
      newLength,
      buffer.sampleRate
    )
    const src = offline.createBufferSource()
    src.buffer = buffer
    const gainNode = offline.createGain()
    gainNode.gain.value = gainMult
    src.connect(gainNode)
    gainNode.connect(offline.destination)
    src.start(0)
    const rendered = await offline.startRendering()
    const blob = audioBufferToWav(rendered)
    setPreviewUrl(URL.createObjectURL(blob))
  }

  function togglePreview() {
    const audio = previewAudioRef.current
    if (!audio) return
    if (isPreviewPlaying) {
      audio.pause()
    } else {
      audio.currentTime = 0
      audio.play().catch(() => toast.error('Playback failed'))
    }
  }

  React.useEffect(() => {
    const audio = previewAudioRef.current
    if (!audio) return
    const onPlay = () => setIsPreviewPlaying(true)
    const onPause = () => setIsPreviewPlaying(false)
    const onEnd = () => setIsPreviewPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnd)
    }
  }, [previewUrl])

  async function handleApply() {
    if (!audioBuffer) return
    setProcessing(true)
    try {
      const OfflineAudioCtx =
        window.OfflineAudioContext ||
        (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
          .webkitOfflineAudioContext
      const offline = new OfflineAudioCtx(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      )
      const src = offline.createBufferSource()
      src.buffer = audioBuffer
      const gainNode = offline.createGain()
      gainNode.gain.value = gain
      src.connect(gainNode)
      gainNode.connect(offline.destination)
      src.start(0)
      const rendered = await offline.startRendering()

      const blob = audioBufferToWav(rendered)
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      setOutputUrl(URL.createObjectURL(blob))
      setOutputSize(blob.size)
      const db = 20 * Math.log10(gain)
      toast.success(
        `Volume ${db >= 0 ? '+' : ''}${db.toFixed(1)} dB applied (${formatFileSize(blob.size)})`
      )
    } catch (err) {
      console.error(err)
      toast.error('Failed to apply volume change')
    } finally {
      setProcessing(false)
    }
  }

  function reset() {
    setFile(null)
    setAudioBuffer(null)
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setOutputUrl('')
    setOutputSize(0)
    setPreviewUrl('')
  }

  function downloadOutput() {
    if (!outputUrl) return
    const a = document.createElement('a')
    a.href = outputUrl
    const baseName = file?.name.replace(/\.[^.]+$/, '') || 'audio'
    a.download = `${baseName}-volume-boosted.wav`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Download started')
  }

  const gainDb = 20 * Math.log10(gain)

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
                    {audioBuffer?.sampleRate.toLocaleString()} Hz
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                <RefreshCw className="h-4 w-4" />
                New file
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <FieldLabel className="mb-0">Volume multiplier</FieldLabel>
                <Badge variant="secondary" className="font-mono">
                  {gain.toFixed(2)}× ({gainDb >= 0 ? '+' : ''}
                  {gainDb.toFixed(1)} dB)
                </Badge>
              </div>
              <Slider
                value={[gain]}
                min={0}
                max={4}
                step={0.05}
                onValueChange={(v) => setGain(v[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Mute (0×)</span>
                <span>1× (original)</span>
                <span>4× (max)</span>
              </div>
            </div>

            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: '-6 dB', val: 0.5 },
                { label: 'Original', val: 1 },
                { label: '+3 dB', val: 1.41 },
                { label: '+6 dB', val: 2 },
                { label: '+12 dB', val: 4 },
              ].map((p) => (
                <Button
                  key={p.label}
                  variant={gain === p.val ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGain(p.val)}
                  className={gain === p.val ? 'bg-fuchsia-600 hover:bg-fuchsia-700' : ''}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="rounded-lg border border-border bg-card/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    onClick={togglePreview}
                    size="sm"
                    className="gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-700"
                  >
                    {isPreviewPlaying ? (
                      <>
                        <Pause className="h-4 w-4" /> Pause preview
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" /> Play preview (10s)
                      </>
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Adjusted volume at {gain.toFixed(2)}×
                  </span>
                </div>
                <audio ref={previewAudioRef} src={previewUrl} className="hidden" />
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleApply}
                disabled={processing}
                className="gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                {processing ? 'Processing…' : 'Apply & export WAV'}
              </Button>
              {outputUrl && (
                <DownloadButton
                  onClick={downloadOutput}
                  label={`Download WAV (${formatFileSize(outputSize)})`}
                />
              )}
            </div>

            {outputUrl && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-xs text-muted-foreground mb-1">Preview boosted audio (full length)</p>
                <audio src={outputUrl} controls className="w-full" />
              </div>
            )}
          </div>
        )}
        {!file && (
          <div className="mt-4">
            <EmptyState message="Upload an audio file to adjust its volume." />
          </div>
        )}
      </ToolCardWrapper>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">About volume & clipping</p>
        <p>
          Volume is changed using a <code>GainNode</code> inside an{' '}
          <code>OfflineAudioContext</code>. Values above 1× amplify the signal; values above 4× may
          cause clipping (distortion). The preview renders the first 10 seconds so you can hear
          the change before exporting the full file.
        </p>
      </div>
    </div>
  )
}
