'use client'

import * as React from 'react'
import {
  Upload,
  Download,
  Film,
  RefreshCw,
  Loader2,
  TrendingDown,
  Gauge,
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
import { formatTime, formatFileSize, pickSupportedMimeTypes } from '@/lib/audio-utils'

const RESOLUTIONS = [
  { value: 'original', label: 'Original resolution' },
  { value: '1080', label: '1080p (Full HD)' },
  { value: '720', label: '720p (HD)' },
  { value: '480', label: '480p (SD)' },
  { value: '360', label: '360p (Low)' },
  { value: '240', label: '240p (Very low)' },
]

const BITRATES = [
  { value: '500000', label: '0.5 Mbps — very low' },
  { value: '1000000', label: '1 Mbps — low' },
  { value: '2000000', label: '2 Mbps — medium' },
  { value: '4000000', label: '4 Mbps — high' },
  { value: '8000000', label: '8 Mbps — very high' },
]

export default function VideoCompressor() {
  const [file, setFile] = React.useState<File | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [outputUrl, setOutputUrl] = React.useState<string>('')
  const [outputSize, setOutputSize] = React.useState<number>(0)
  const [resolution, setResolution] = React.useState('720')
  const [bitrate, setBitrate] = React.useState('2000000')
  const [duration, setDuration] = React.useState(0)
  const [videoDims, setVideoDims] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [dragOver, setDragOver] = React.useState(false)

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

  // Compute target dimensions
  const targetDims = React.useMemo(() => {
    if (resolution === 'original' || !videoDims.w)
      return { w: videoDims.w, h: videoDims.h }
    const targetH = Number(resolution)
    if (videoDims.h === 0) return { w: 0, h: 0 }
    const scale = targetH / videoDims.h
    return {
      w: Math.round(videoDims.w * scale),
      h: targetH,
    }
  }, [resolution, videoDims])

  async function handleCompress() {
    if (!file || !videoRef.current || duration === 0) return
    setProcessing(true)
    setProgress(0)
    try {
      const blob = await reencodeVideo(
        videoRef.current,
        targetDims.w,
        targetDims.h,
        Number(bitrate),
        (p) => setProgress(p)
      )
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      setOutputUrl(URL.createObjectURL(blob))
      setOutputSize(blob.size)
      const saved = Math.max(0, Math.round((1 - blob.size / file.size) * 100))
      toast.success(`Compressed (${formatFileSize(blob.size)} — ${saved}% smaller)`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Compression failed')
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
    a.download = `${baseName}-compressed.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Download started')
  }

  const estimatedSize = React.useMemo(() => {
    if (duration === 0) return 0
    return Math.round((Number(bitrate) / 8) * duration)
  }, [bitrate, duration])

  const savings = file && outputSize > 0
    ? Math.max(0, Math.round((1 - outputSize / file.size) * 100))
    : estimatedSize > 0 && file
      ? Math.max(0, Math.round((1 - estimatedSize / file.size) * 100))
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
              Supports MP4, WebM, MOV, MKV — 100% in your browser
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
                    {videoDims.w}×{videoDims.h} · {file.type || 'video'}
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

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Target resolution</FieldLabel>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>Target bitrate</FieldLabel>
                <Select value={bitrate} onValueChange={setBitrate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BITRATES.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card/50 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Output dimensions:</span>{' '}
              {targetDims.w}×{targetDims.h} ·{' '}
              <span className="font-medium text-foreground">Est. size:</span>{' '}
              {estimatedSize > 0 ? formatFileSize(estimatedSize) : '—'} ·{' '}
              <span className="font-medium text-foreground">Est. savings:</span>{' '}
              {savings > 0 ? (
                <span className="text-emerald-600">{savings}%</span>
              ) : (
                '—'
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleCompress}
                disabled={processing}
                className="gap-1.5 bg-teal-600 hover:bg-teal-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gauge className="h-4 w-4" />
                )}
                {processing ? 'Compressing…' : 'Compress video'}
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
                  Re-encoding video in real time… {Math.round(progress)}%
                </p>
              </div>
            )}

            {outputUrl && !processing && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-emerald-600 gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {savings}% smaller
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
            <EmptyState message="Upload a video file to start compressing." />
          </div>
        )}
      </ToolCardWrapper>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">About video compression</p>
        <p>
          Compression works by drawing each frame of your video onto a smaller canvas and
          re-recording the canvas stream with <code>MediaRecorder</code> at a lower bitrate. The
          output is a WebM file. Compression takes about as long as the video itself (it plays in
          real time), so for very long videos be patient.
        </p>
      </div>
    </div>
  )
}

/**
 * Re-encode a video by drawing its frames to a resized canvas and recording
 * with MediaRecorder. Captures audio from the video's captureStream().
 */
async function reencodeVideo(
  video: HTMLVideoElement,
  targetW: number,
  targetH: number,
  bitrate: number,
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

  const cw = Math.max(2, targetW || video.videoWidth)
  const ch = Math.max(2, targetH || video.videoHeight)

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  const wasMuted = video.muted
  const wasVolume = video.volume
  video.muted = true
  video.volume = 0

  // Seek to start
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
    mimeType
      ? { mimeType, videoBitsPerSecond: bitrate }
      : { videoBitsPerSecond: bitrate }
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
