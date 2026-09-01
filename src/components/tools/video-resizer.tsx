'use client'

import * as React from 'react'
import {
  Upload,
  Download,
  Film,
  RefreshCw,
  Loader2,
  Maximize2,
  Square,
  RectangleVertical,
  RectangleHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
  DownloadButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatTime, formatFileSize, pickSupportedMimeTypes } from '@/lib/audio-utils'

type PresetId = 'square' | 'portrait' | 'landscape' | 'custom'

const PRESETS: {
  id: PresetId
  label: string
  w: number
  h: number
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'square', label: 'Square', w: 1080, h: 1080, icon: Square },
  { id: 'portrait', label: 'Portrait (9:16)', w: 1080, h: 1920, icon: RectangleVertical },
  { id: 'landscape', label: 'Landscape (16:9)', w: 1920, h: 1080, icon: RectangleHorizontal },
  { id: 'custom', label: 'Custom', w: 0, h: 0, icon: Maximize2 },
]

export default function VideoResizer() {
  const [file, setFile] = React.useState<File | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [outputUrl, setOutputUrl] = React.useState<string>('')
  const [outputSize, setOutputSize] = React.useState<number>(0)
  const [duration, setDuration] = React.useState(0)
  const [videoDims, setVideoDims] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [dragOver, setDragOver] = React.useState(false)

  const [preset, setPreset] = React.useState<PresetId>('square')
  const [width, setWidth] = React.useState(1080)
  const [height, setHeight] = React.useState(1080)
  const [maintainAspect, setMaintainAspect] = React.useState(false)

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
  }

  function applyPreset(p: PresetId) {
    setPreset(p)
    setMaintainAspect(false)
    if (p === 'square') {
      setWidth(1080)
      setHeight(1080)
    } else if (p === 'portrait') {
      setWidth(1080)
      setHeight(1920)
    } else if (p === 'landscape') {
      setWidth(1920)
      setHeight(1080)
    } else if (videoDims.w > 0) {
      // custom: default to the original dimensions
      setWidth(videoDims.w)
      setHeight(videoDims.h)
    }
  }

  function onWidthChange(v: number) {
    setPreset('custom')
    if (maintainAspect && videoDims.w > 0) {
      const ratio = videoDims.h / videoDims.w
      setHeight(Math.max(2, Math.round(v * ratio)))
    }
    setWidth(Math.max(2, v))
  }

  function onHeightChange(v: number) {
    setPreset('custom')
    if (maintainAspect && videoDims.h > 0) {
      const ratio = videoDims.w / videoDims.h
      setWidth(Math.max(2, Math.round(v * ratio)))
    }
    setHeight(Math.max(2, v))
  }

  async function handleResize() {
    if (!file || !videoRef.current || duration === 0) return
    if (width < 2 || height < 2) {
      toast.error('Invalid dimensions')
      return
    }
    setProcessing(true)
    setProgress(0)
    try {
      const blob = await resizeVideo(
        videoRef.current,
        width,
        height,
        (p) => setProgress(p)
      )
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      setOutputUrl(URL.createObjectURL(blob))
      setOutputSize(blob.size)
      toast.success(`Resized to ${width}×${height} (${formatFileSize(blob.size)})`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Resize failed')
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
    setDuration(0)
    setVideoDims({ w: 0, h: 0 })
  }

  function downloadOutput() {
    if (!outputUrl) return
    const a = document.createElement('a')
    a.href = outputUrl
    const baseName = file?.name.replace(/\.[^.]+$/, '') || 'video'
    a.download = `${baseName}-${width}x${height}.webm`
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
              Resize to any dimensions — 100% in your browser
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

            {/* Presets */}
            <div>
              <FieldLabel>Preset</FieldLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESETS.map((p) => {
                  const Icon = p.icon
                  const active = preset === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors',
                        active
                          ? 'border-teal-500 bg-teal-500/10 text-teal-600'
                          : 'border-border hover:border-teal-500/50'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{p.label}</span>
                      {p.id !== 'custom' && (
                        <span className="text-[10px] text-muted-foreground">
                          {p.w}×{p.h}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Width (px)</FieldLabel>
                <Input
                  type="number"
                  min={2}
                  max={3840}
                  value={width}
                  onChange={(e) => onWidthChange(Number(e.target.value) || 2)}
                />
              </div>
              <div>
                <FieldLabel>Height (px)</FieldLabel>
                <Input
                  type="number"
                  min={2}
                  max={3840}
                  value={height}
                  onChange={(e) => onHeightChange(Number(e.target.value) || 2)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Maintain aspect ratio</p>
                <p className="text-xs text-muted-foreground">
                  Auto-adjust the other dimension from the source aspect ratio.
                </p>
              </div>
              <Switch
                checked={maintainAspect}
                onCheckedChange={setMaintainAspect}
              />
            </div>

            <div className="rounded-lg border border-border bg-card/50 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Source:</span>{' '}
              {videoDims.w}×{videoDims.h} ·{' '}
              <span className="font-medium text-foreground">Target:</span>{' '}
              <span className="text-teal-600 font-medium">{width}×{height}</span>{' '}
              {videoDims.w > 0 && (
                <>
                  ·{' '}
                  <span className="font-medium text-foreground">Aspect:</span>{' '}
                  {(width / height).toFixed(2)} (source {(videoDims.w / videoDims.h).toFixed(2)})
                </>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleResize}
                disabled={processing}
                className="gap-1.5 bg-teal-600 hover:bg-teal-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                {processing ? 'Resizing…' : 'Resize video'}
              </Button>
              {outputUrl && (
                <DownloadButton
                  onClick={downloadOutput}
                  label={`Download WebM (${formatFileSize(outputSize)})`}
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
                  Re-encoding in real time… {Math.round(progress)}%
                </p>
              </div>
            )}

            {outputUrl && !processing && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-emerald-600">
                    {width}×{height}
                  </Badge>
                  <Badge variant="secondary">{formatFileSize(outputSize)}</Badge>
                </div>
                <video src={outputUrl} controls className="w-full rounded-md max-h-[280px]" />
              </div>
            )}
          </div>
        )}
        {!file && (
          <div className="mt-4">
            <EmptyState message="Upload a video file to start resizing." />
          </div>
        )}
      </ToolCardWrapper>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How resizing works</p>
        <p>
          We draw each video frame onto a canvas at your chosen dimensions and re-encode the
          canvas stream with <code>MediaRecorder</code>. The output is a WebM file with the
          source&apos;s audio track preserved. Resizing happens in real time, so plan for the
          clip&apos;s full duration when processing longer videos.
        </p>
      </div>
    </div>
  )
}

async function resizeVideo(
  video: HTMLVideoElement,
  targetW: number,
  targetH: number,
  onProgress: (p: number) => void
): Promise<Blob> {
  if (video.readyState < 2) {
    await new Promise<void>((resolve) => {
      const onReady = () => {
        video.removeEventListener('loadeddata', onReady)
        resolve()
      }
      video.addEventListener('loadeddata', onReady)
    })
  }

  const cw = Math.max(2, Math.min(1920, targetW))
  const ch = Math.max(2, Math.min(1920, targetH))

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

  await seekTo(video, 0)

  const canvasStream = canvas.captureStream(30)
  const videoStream = video.captureStream
    ? video.captureStream()
    : (video as unknown as { mozCaptureStream?: () => MediaStream }).mozCaptureStream?.()
  const audioTracks = videoStream ? videoStream.getAudioTracks() : []

  const combined = new MediaStream()
  canvasStream.getVideoTracks().forEach((t) => combined.addTrack(t))
  audioTracks.forEach((t) => combined.addTrack(t))

  const mimeType =
    pickSupportedMimeTypes([
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ]) ?? ''

  const recorder = new MediaRecorder(
    combined,
    mimeType ? { mimeType, videoBitsPerSecond: 4_000_000 } : { videoBitsPerSecond: 4_000_000 }
  )
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })

  let drawing = true
  const draw = () => {
    if (!drawing) return
    if (!video.paused && !video.ended) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, cw, ch)
      ctx.drawImage(video, 0, 0, cw, ch)
    }
    const progress = Math.min(100, (video.currentTime / video.duration) * 100)
    onProgress(progress)
    if (video.ended) {
      drawing = false
      if (recorder.state !== 'inactive') recorder.stop()
      return
    }
    requestAnimationFrame(draw)
  }

  recorder.start(100)
  video.play().catch(() => {})
  requestAnimationFrame(draw)

  const safety = new Promise<void>((resolve) => {
    setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop()
      resolve()
    }, video.duration * 1000 + 5000)
  })

  await Promise.race([stopped, safety])
  await stopped

  drawing = false
  video.pause()
  video.muted = wasMuted
  video.volume = wasVolume

  return new Blob(chunks, { type: mimeType || 'video/webm' })
}

function seekTo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = t
  })
}
