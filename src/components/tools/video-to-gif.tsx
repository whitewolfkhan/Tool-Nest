'use client'

import * as React from 'react'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import {
  Upload,
  Download,
  Film,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
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
import { formatTime, formatFileSize } from '@/lib/audio-utils'

const FPS_OPTIONS = [
  { value: '5', label: '5 fps — tiny' },
  { value: '10', label: '10 fps — small' },
  { value: '15', label: '15 fps — balanced' },
  { value: '20', label: '20 fps — smooth' },
  { value: '24', label: '24 fps — film' },
]

const WIDTH_OPTIONS = [
  { value: '0', label: 'Auto (original)' },
  { value: '320', label: '320 px' },
  { value: '480', label: '480 px' },
  { value: '640', label: '640 px' },
  { value: '800', label: '800 px' },
]

export default function VideoToGif() {
  const [file, setFile] = React.useState<File | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [outputUrl, setOutputUrl] = React.useState<string>('')
  const [outputSize, setOutputSize] = React.useState<number>(0)
  const [frameCount, setFrameCount] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [videoDims, setVideoDims] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [dragOver, setDragOver] = React.useState(false)

  const [start, setStart] = React.useState(0)
  const [end, setEnd] = React.useState(0)
  const [fps, setFps] = React.useState('10')
  const [width, setWidth] = React.useState('480')
  const [useCustomRange, setUseCustomRange] = React.useState(false)
  const [customWidth, setCustomWidth] = React.useState('480')

  const videoRef = React.useRef<HTMLVideoElement | null>(null)

  React.useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      if (outputUrl) URL.revokeObjectURL(outputUrl)
    }
  }, [objectUrl, outputUrl])

  function loadFile(f: File) {
    setLoading(true)
    setOutputUrl('')
    setOutputSize(0)
    setFrameCount(0)
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    const url = URL.createObjectURL(f)
    setFile(f)
    setObjectUrl(url)
    setProgress(0)
    setLoading(false)
    toast.success('Video loaded')
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f && f.type.startsWith('video/')) loadFile(f)
    else toast.error('Please drop a video file')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('video/')) loadFile(f)
    else toast.error('Please drop a video file')
  }

  function handleLoadedMetadata() {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration)
    setVideoDims({ w: v.videoWidth, h: v.videoHeight })
    setEnd(v.duration)
    setStart(0)
    // Auto-pick width based on input size
    const w = v.videoWidth || 480
    const auto = w > 800 ? '640' : '480'
    setWidth(auto)
    setCustomWidth(auto)
  }

  async function handleConvert() {
    if (!file || !videoRef.current || duration === 0) return
    if (end - start < 0.1) {
      toast.error('Selection too short')
      return
    }
    setProcessing(true)
    setProgress(0)
    try {
      const targetWidth = Number(width === '0' ? customWidth : width)
      const result = await convertToGif(
        videoRef.current,
        start,
        end,
        Number(fps),
        targetWidth,
        (p) => setProgress(p),
        (count) => setFrameCount(count)
      )
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      setOutputUrl(URL.createObjectURL(result.blob))
      setOutputSize(result.blob.size)
      toast.success(`GIF created (${formatFileSize(result.blob.size)}, ${result.frameCount} frames)`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'GIF conversion failed')
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  function reset() {
    setFile(null)
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setObjectUrl('')
    setOutputUrl('')
    setOutputSize(0)
    setFrameCount(0)
    setDuration(0)
    setVideoDims({ w: 0, h: 0 })
    setStart(0)
    setEnd(0)
  }

  function downloadOutput() {
    if (!outputUrl) return
    const a = document.createElement('a')
    a.href = outputUrl
    const baseName = file?.name.replace(/\.[^.]+$/, '') || 'video'
    a.download = `${baseName}.gif`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Download started')
  }

  const targetWidth = Number(width === '0' ? customWidth : width)
  const targetHeight = videoDims.w > 0 && targetWidth > 0
    ? Math.round((videoDims.h / videoDims.w) * targetWidth)
    : 0

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
                ? 'border-teal-500 bg-teal-500/5'
                : 'border-border hover:border-teal-500/50'
            )}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10 mb-3">
              {loading ? (
                <Loader2 className="h-7 w-7 animate-spin text-teal-500" />
              ) : (
                <Upload className="h-7 w-7 text-teal-500" />
              )}
            </div>
            <p className="text-base font-medium">
              {loading ? 'Loading…' : 'Drop your video file here'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Convert a clip to an animated GIF — 100% in your browser
            </p>
            <label className="mt-4 cursor-pointer">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileInput}
                className="sr-only"
              />
              <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Upload className="h-4 w-4" />
                Choose Video File
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 shrink-0">
                  <Film className="h-5 w-5 text-teal-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate max-w-[260px] sm:max-w-md">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} · {formatTime(duration)} ·{' '}
                    {videoDims.w}×{videoDims.h}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                <RefreshCw className="h-4 w-4" />
                New file
              </Button>
            </div>

            <video
              ref={videoRef}
              src={objectUrl}
              onLoadedMetadata={handleLoadedMetadata}
              controls
              playsInline
              muted
              className="w-full max-h-[280px] rounded-lg border border-border bg-black"
            />

            {/* Custom range toggle */}
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Custom time range</p>
                <p className="text-xs text-muted-foreground">
                  Trim a portion of the video before converting.
                </p>
              </div>
              <Switch
                checked={useCustomRange}
                onCheckedChange={(v) => {
                  setUseCustomRange(v)
                  if (!v) {
                    setStart(0)
                    setEnd(duration)
                  }
                }}
              />
            </div>

            {useCustomRange && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>
                    Start: <span className="text-teal-600 font-mono">{formatTime(start)}</span>
                  </FieldLabel>
                  <Slider
                    value={[start]}
                    min={0}
                    max={duration}
                    step={0.1}
                    onValueChange={(v) => setStart(Math.min(v[0], end - 0.1))}
                  />
                </div>
                <div>
                  <FieldLabel>
                    End: <span className="text-teal-600 font-mono">{formatTime(end)}</span>
                  </FieldLabel>
                  <Slider
                    value={[end]}
                    min={0}
                    max={duration}
                    step={0.1}
                    onValueChange={(v) => setEnd(Math.max(v[0], start + 0.1))}
                  />
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Frame rate</FieldLabel>
                <Select value={fps} onValueChange={setFps}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FPS_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>Width</FieldLabel>
                <Select value={width} onValueChange={setWidth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WIDTH_OPTIONS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {width === '0' && (
              <div>
                <FieldLabel>Custom width (px)</FieldLabel>
                <input
                  type="number"
                  value={customWidth}
                  min={16}
                  max={1920}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            )}

            <div className="rounded-lg border border-border bg-card/50 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Output:</span>{' '}
              {targetWidth}×{targetHeight || '?'} ·{' '}
              <span className="font-medium text-foreground">Duration:</span>{' '}
              {formatTime(useCustomRange ? Math.max(0, end - start) : duration)} ·{' '}
              <span className="font-medium text-foreground">Frames:</span>{' '}
              {Math.round(
                (useCustomRange ? Math.max(0, end - start) : duration) * Number(fps)
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleConvert}
                disabled={processing}
                className="gap-1.5 bg-teal-600 hover:bg-teal-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                {processing ? 'Converting…' : 'Convert to GIF'}
              </Button>
              {outputUrl && (
                <DownloadButton
                  onClick={downloadOutput}
                  label={`Download GIF (${formatFileSize(outputSize)})`}
                />
              )}
            </div>

            {processing && (
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-teal-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Extracting & encoding frames… {Math.round(progress)}% · {frameCount} frames
                </p>
              </div>
            )}

            {outputUrl && !processing && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-emerald-600">
                    {frameCount} frames
                  </Badge>
                  <Badge variant="secondary">{formatFileSize(outputSize)}</Badge>
                </div>
                <img
                  src={outputUrl}
                  alt="Generated GIF"
                  className="w-full rounded-md max-h-[360px] object-contain bg-black/5"
                />
              </div>
            )}
          </div>
        )}
        {!file && (
          <div className="mt-4">
            <EmptyState message="Upload a video to convert into an animated GIF." />
          </div>
        )}
      </ToolCardWrapper>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">About GIF conversion</p>
        <p>
          We extract frames by seeking through the video and drawing each one to a canvas, then
          build the GIF with the fast <code>gifenc</code> library (color quantization per frame).
          GIFs have no audio and a 256-color palette, so they&apos;re best for short loops
          (under 10 seconds). Use lower FPS and smaller width for smaller files.
        </p>
      </div>
    </div>
  )
}

interface GifResult {
  blob: Blob
  frameCount: number
}

/**
 * Convert a video segment to an animated GIF using gifenc.
 *
 * Strategy: seek through the video at fixed intervals, draw each frame to a
 * downscaled canvas, read back RGBA pixels, quantize a 256-color palette,
 * and write the indexed frame to the GIF encoder.
 */
async function convertToGif(
  video: HTMLVideoElement,
  startSec: number,
  endSec: number,
  fps: number,
  targetWidth: number,
  onProgress: (p: number) => void,
  onFrame: (count: number) => void
): Promise<GifResult> {
  if (video.readyState < 2) {
    await new Promise<void>((resolve) => {
      const onReady = () => {
        video.removeEventListener('loadeddata', onReady)
        resolve()
      }
      video.addEventListener('loadeddata', onReady)
    })
  }

  const vw = video.videoWidth || 640
  const vh = video.videoHeight || 480
  const cw = Math.max(2, Math.min(targetWidth || vw, 1280))
  const ch = Math.max(2, Math.round((vh / vw) * cw))

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, cw, ch)

  const wasMuted = video.muted
  const wasVolume = video.volume
  video.muted = true
  video.volume = 0

  const duration = endSec - startSec
  const frameDelay = Math.round(1000 / fps) // ms
  const totalFrames = Math.max(1, Math.floor(duration * fps))

  const encoder = GIFEncoder()
  encoder.writeHeader()
  // Logical screen descriptor
  encoder.writeFrameInfo?.(cw, ch) // safe noop if undefined

  const wasLooping = encoder.writeFrameInfo
  void wasLooping

  // Use a manual loop: write each frame with its own palette
  let written = 0
  for (let i = 0; i < totalFrames; i++) {
    const t = startSec + (i / fps)
    if (t > endSec) break
    await seekTo(video, t)
    // Draw a black background then the video frame
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, cw, ch)
    ctx.drawImage(video, 0, 0, cw, ch)

    const imgData = ctx.getImageData(0, 0, cw, ch)
    const rgba = imgData.data
    const palette = quantize(rgba, 256)
    const indexed = applyPalette(rgba, palette)

    // gifenc writes a full GIF frame including local color table.
    encoder.writeFrame(indexed, cw, ch, {
      palette,
      delay: frameDelay,
      // Loop on the first frame: tells gifenc to emit a NETSCAPE loop block
      loop: i === 0 ? 0 : undefined,
      transparent: false,
    })

    written++
    onFrame(written)
    onProgress(Math.round(((i + 1) / totalFrames) * 100))
    // Yield to UI occasionally
    if (i % 2 === 0) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  encoder.finish()
  const bytes = encoder.bytes()
  // Copy into a fresh Uint8Array view so the Blob constructor sees an ArrayBuffer
  const buf = new Uint8Array(bytes.length)
  buf.set(bytes)
  const blob = new Blob([buf], { type: 'image/gif' })

  video.muted = wasMuted
  video.volume = wasVolume

  return { blob, frameCount: written }
}

function seekTo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      // Small delay to ensure the frame is actually painted
      requestAnimationFrame(() => resolve())
    }
    video.addEventListener('seeked', onSeeked)
    try {
      video.currentTime = Math.min(t, video.duration || t)
    } catch {
      resolve()
    }
  })
}
