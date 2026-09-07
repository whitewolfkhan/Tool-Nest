'use client'

import * as React from 'react'
import {
  Upload,
  Download,
  Play,
  Pause,
  Scissors,
  Music2,
  RefreshCw,
  Loader2,
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

export default function AudioTrimmer() {
  const [file, setFile] = React.useState<File | null>(null)
  const [audioBuffer, setAudioBuffer] = React.useState<AudioBuffer | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [outputUrl, setOutputUrl] = React.useState<string>('')
  const [outputSize, setOutputSize] = React.useState<number>(0)
  const [start, setStart] = React.useState(0)
  const [end, setEnd] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const dragRef = React.useRef<HTMLDivElement | null>(null)
  const [dragOver, setDragOver] = React.useState(false)

  const duration = audioBuffer?.duration ?? 0

  // Cleanup object URLs on unmount / change
  React.useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  React.useEffect(() => {
    return () => {
      if (outputUrl) URL.revokeObjectURL(outputUrl)
    }
  }, [outputUrl])

  // Draw waveform when buffer changes
  React.useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return
    drawWaveform(canvasRef.current, audioBuffer, start, end)
  }, [audioBuffer, start, end])

  // Update current time from audio element
  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onEnd = () => setIsPlaying(false)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [objectUrl])

  async function loadFile(f: File) {
    setLoading(true)
    setOutputUrl('')
    setOutputSize(0)
    try {
      const buf = await decodeAudioFile(f)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      const url = URL.createObjectURL(f)
      setFile(f)
      setAudioBuffer(buf)
      setObjectUrl(url)
      setStart(0)
      setEnd(buf.duration)
      setCurrentTime(0)
      toast.success('Audio loaded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to decode audio. Try a different file (MP3, WAV, OGG, M4A).')
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

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => toast.error('Playback failed'))
    }
  }

  function playSelection() {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = start
    audio.play().catch(() => toast.error('Playback failed'))
  }

  // Stop playback when current time exceeds end (if playing selection)
  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying && currentTime >= end && end < duration - 0.05) {
      audio.pause()
      audio.currentTime = start
    }
  }, [currentTime, end, isPlaying, duration, start])

  function seekTo(time: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(duration, time))
    setCurrentTime(audio.currentTime)
  }

  async function handleTrim() {
    if (!audioBuffer) return
    setProcessing(true)
    try {
      const sliced = sliceForTrim(audioBuffer, start, end)
      const blob = audioBufferToWav(sliced)
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      const url = URL.createObjectURL(blob)
      setOutputUrl(url)
      setOutputSize(blob.size)
      toast.success(`Trimmed audio ready (${formatFileSize(blob.size)})`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to trim audio')
    } finally {
      setProcessing(false)
    }
  }

  function reset() {
    setFile(null)
    setAudioBuffer(null)
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setObjectUrl('')
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setOutputUrl('')
    setOutputSize(0)
    setStart(0)
    setEnd(0)
    setCurrentTime(0)
  }

  function downloadOutput() {
    if (!outputUrl) return
    const a = document.createElement('a')
    a.href = outputUrl
    const baseName = file?.name.replace(/\.[^.]+$/, '') || 'audio'
    a.download = `${baseName}-trimmed.wav`
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
            ref={dragRef}
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
            {/* File info */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-500/10 shrink-0">
                  <Music2 className="h-5 w-5 text-fuchsia-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate max-w-[260px] sm:max-w-md">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} · {formatTime(duration)} ·{' '}
                    {audioBuffer?.numberOfChannels === 1 ? 'Mono' : 'Stereo'} ·{' '}
                    {audioBuffer?.sampleRate.toLocaleString()} Hz
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                <RefreshCw className="h-4 w-4" />
                New file
              </Button>
            </div>

            {/* Waveform */}
            <div>
              <canvas
                ref={canvasRef}
                className="w-full h-28 rounded-lg border border-border bg-background"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0:00</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Hidden audio element for preview */}
            <audio ref={audioRef} src={objectUrl} preload="auto" className="hidden" />

            {/* Playback controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={togglePlay}
                size="sm"
                className="gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-700"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Play
                  </>
                )}
              </Button>
              <Button
                onClick={playSelection}
                size="sm"
                variant="outline"
                className="gap-1.5"
              >
                <Play className="h-4 w-4" /> Play selection
              </Button>
              <Badge variant="secondary" className="font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Badge>
            </div>

            {/* Trim sliders */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>
                  Start: <span className="text-fuchsia-600 font-mono">{formatTime(start)}</span>
                </FieldLabel>
                <Slider
                  value={[start]}
                  min={0}
                  max={duration}
                  step={0.01}
                  onValueChange={(v) => {
                    const next = Math.min(v[0], end - 0.05)
                    setStart(Math.max(0, next))
                    seekTo(Math.max(0, next))
                  }}
                />
              </div>
              <div>
                <FieldLabel>
                  End: <span className="text-fuchsia-600 font-mono">{formatTime(end)}</span>
                </FieldLabel>
                <Slider
                  value={[end]}
                  min={0}
                  max={duration}
                  step={0.01}
                  onValueChange={(v) => {
                    const next = Math.max(v[0], start + 0.05)
                    setEnd(Math.min(duration, next))
                    seekTo(Math.min(duration, next))
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-card/50 p-3">
                <p className="text-xs text-muted-foreground">Original duration</p>
                <p className="text-lg font-semibold">{formatTime(duration)}</p>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-3">
                <p className="text-xs text-muted-foreground">Trimmed duration</p>
                <p className="text-lg font-semibold text-fuchsia-600">
                  {formatTime(Math.max(0, end - start))}
                </p>
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleTrim}
                disabled={processing || end - start < 0.05}
                className="gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Scissors className="h-4 w-4" />
                )}
                {processing ? 'Trimming…' : 'Trim audio'}
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
                <p className="text-xs text-muted-foreground mb-1">Preview trimmed audio</p>
                <audio src={outputUrl} controls className="w-full" />
              </div>
            )}
          </div>
        )}
        {!file && (
          <div className="mt-4">
            <EmptyState message="Upload an audio file to start trimming." />
          </div>
        )}
      </ToolCardWrapper>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How it works</p>
        <p>
          Your audio is decoded in the browser with the Web Audio API. Drag the start and end
          sliders to pick the segment you want to keep, preview it, then export. The trimmed
          audio is re-encoded to WAV (16-bit PCM) entirely on your device — nothing is uploaded.
        </p>
      </div>
    </div>
  )
}

/**
 * Slice a portion of an AudioBuffer for trimming.
 */
function sliceForTrim(
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate
  const numChannels = buffer.numberOfChannels
  const startSample = Math.max(0, Math.floor(startSec * sampleRate))
  const endSample = Math.min(buffer.length, Math.floor(endSec * sampleRate))
  const length = Math.max(1, endSample - startSample)

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx()
  const sliced = ctx.createBuffer(numChannels, length, sampleRate)
  ctx.close().catch(() => {})

  for (let c = 0; c < numChannels; c++) {
    const src = buffer.getChannelData(c)
    const dst = sliced.getChannelData(c)
    for (let i = 0; i < length; i++) {
      dst[i] = src[startSample + i]
    }
  }
  return sliced
}

/**
 * Draw a simple waveform (peak envelope) of the AudioBuffer onto the canvas.
 * The selected region [start, end] is highlighted; outside regions are dimmed.
 */
function drawWaveform(
  canvas: HTMLCanvasElement,
  buffer: AudioBuffer,
  start: number,
  end: number
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // High-DPI scaling
  const dpr = window.devicePixelRatio || 1
  const cssW = canvas.clientWidth
  const cssH = canvas.clientHeight
  if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
    canvas.width = cssW * dpr
    canvas.height = cssH * dpr
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const w = cssW
  const h = cssH
  ctx.clearRect(0, 0, w, h)

  // Use channel 0 (mix down by averaging both channels if stereo)
  const channels = buffer.numberOfChannels
  const data0 = buffer.getChannelData(0)
  const data1 = channels > 1 ? buffer.getChannelData(1) : null

  // For performance, compute one peak per pixel column
  const samplesPerPixel = Math.max(1, Math.floor(buffer.length / w))
  const peaks: number[] = new Array(w)
  let maxPeak = 0.0001
  for (let x = 0; x < w; x++) {
    const startSample = x * samplesPerPixel
    const endSample = Math.min(buffer.length, startSample + samplesPerPixel)
    let max = 0
    for (let i = startSample; i < endSample; i++) {
      const v = data1 ? (Math.abs(data0[i]) + Math.abs(data1[i])) * 0.5 : Math.abs(data0[i])
      if (v > max) max = v
    }
    peaks[x] = max
    if (max > maxPeak) maxPeak = max
  }

  // Draw bars
  const mid = h / 2
  const startPx = (start / buffer.duration) * w
  const endPx = (end / buffer.duration) * w

  for (let x = 0; x < w; x++) {
    const inSelection = x >= startPx && x <= endPx
    const peak = peaks[x] / maxPeak
    const barH = Math.max(1, peak * (h * 0.9))
    if (inSelection) {
      ctx.fillStyle = '#d946ef' // fuchsia-500
    } else {
      ctx.fillStyle = 'rgba(120, 120, 140, 0.45)'
    }
    ctx.fillRect(x, mid - barH / 2, 1, barH)
  }

  // Selection markers
  ctx.strokeStyle = 'rgba(217, 70, 239, 0.9)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(startPx, 0)
  ctx.lineTo(startPx, h)
  ctx.moveTo(endPx, 0)
  ctx.lineTo(endPx, h)
  ctx.stroke()

  // Current playback line
  // (current time not available here; left as a static waveform)
}
