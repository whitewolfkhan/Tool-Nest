'use client'

import * as React from 'react'
import {
  Upload,
  Download,
  Film,
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
import { formatTime, formatFileSize, pickSupportedMimeTypes } from '@/lib/audio-utils'

type FormatId = 'webm-vp9' | 'webm-vp8' | 'mp4'

const FORMATS: {
  id: FormatId
  label: string
  ext: string
  mime: string
  note: string
}[] = [
  {
    id: 'webm-vp9',
    label: 'WebM (VP9 + Opus)',
    ext: 'webm',
    mime: 'video/webm;codecs=vp9,opus',
    note: 'Best compression. Supported in Chrome, Firefox, Edge.',
  },
  {
    id: 'webm-vp8',
    label: 'WebM (VP8 + Opus)',
    ext: 'webm',
    mime: 'video/webm;codecs=vp8,opus',
    note: 'Wider compatibility for older browsers.',
  },
  {
    id: 'mp4',
    label: 'MP4 (H.264 + AAC)',
    ext: 'mp4',
    mime: 'video/mp4',
    note: 'Universal. Only if your browser supports MP4 recording (Safari, recent Chrome).',
  },
]

export default function VideoConverter() {
  const [file, setFile] = React.useState<File | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [outputUrl, setOutputUrl] = React.useState<string>('')
  const [outputSize, setOutputSize] = React.useState<number>(0)
  const [outputExt, setOutputExt] = React.useState<string>('webm')
  const [format, setFormat] = React.useState<FormatId>('webm-vp9')
  const [duration, setDuration] = React.useState(0)
  const [videoDims, setVideoDims] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [dragOver, setDragOver] = React.useState(false)
  const [supportedFormats, setSupportedFormats] = React.useState<Record<FormatId, boolean>>({
    'webm-vp9': false,
    'webm-vp8': false,
    mp4: false,
  })

  const videoRef = React.useRef<HTMLVideoElement | null>(null)

  React.useEffect(() => {
    setSupportedFormats({
      'webm-vp9': !!pickSupportedMimeTypes(['video/webm;codecs=vp9,opus']),
      'webm-vp8': !!pickSupportedMimeTypes(['video/webm;codecs=vp8,opus']),
      mp4: !!pickSupportedMimeTypes(['video/mp4;codecs=h264,aac', 'video/mp4']),
    })
  }, [])

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

  async function handleConvert() {
    if (!file || !videoRef.current || duration === 0) return
    const chosen = FORMATS.find((f) => f.id === format)!
    if (!supportedFormats[format]) {
      toast.error(`Your browser cannot record ${chosen.label}. Pick another format.`)
      return
    }
    setProcessing(true)
    setProgress(0)
    try {
      const blob = await convertVideo(
        videoRef.current,
        chosen.mime,
        (p) => setProgress(p)
      )
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      setOutputUrl(URL.createObjectURL(blob))
      setOutputSize(blob.size)
      setOutputExt(chosen.ext)
      toast.success(`Converted to ${chosen.label} (${formatFileSize(blob.size)})`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Conversion failed')
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

            <div>
              <FieldLabel>Convert to</FieldLabel>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as FormatId)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem
                      key={f.id}
                      value={f.id}
                      disabled={!supportedFormats[f.id]}
                    >
                      {f.label}
                      {!supportedFormats[f.id] && ' (unsupported)'}
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
                disabled={processing || !supportedFormats[format]}
                className="gap-1.5 bg-teal-600 hover:bg-teal-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
                {processing ? 'Converting…' : 'Convert video'}
              </Button>
              {outputUrl && (
                <DownloadButton
                  onClick={downloadOutput}
                  label={`Download .${outputExt} (${formatFileSize(outputSize)})`}
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
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Preview converted video ({outputExt.toUpperCase()})
                </p>
                <video src={outputUrl} controls className="w-full rounded-md max-h-[280px]" />
              </div>
            )}
          </div>
        )}
        {!file && (
          <div className="mt-4">
            <EmptyState message="Upload a video file to start converting." />
          </div>
        )}
      </ToolCardWrapper>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">About browser video encoding</p>
        <p>
          Browsers can decode almost any video format, but they can only{' '}
          <em>encode</em> a limited set — usually <strong>WebM (VP8/VP9 + Opus)</strong> and
          sometimes <strong>MP4 (H.264 + AAC)</strong>. We use the{' '}
          <code>MediaRecorder</code> API to capture your video frame-by-frame and re-encode it.
          Conversion happens in real time, so a 1-minute clip takes about 1 minute.
        </p>
      </div>
    </div>
  )
}

/**
 * Convert a video by drawing its frames to a canvas and recording with the
 * chosen mimeType. Captures audio from the video's captureStream().
 */
async function convertVideo(
  video: HTMLVideoElement,
  mimeType: string,
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

  const vw = video.videoWidth || 640
  const vh = video.videoHeight || 480
  const maxW = 1280
  const scale = Math.min(1, maxW / vw)
  const cw = Math.max(2, Math.round(vw * scale))
  const ch = Math.max(2, Math.round(vh * scale))

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Canvas 2D context unavailable')

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

  const recorder = new MediaRecorder(combined, { mimeType })
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

  return new Blob(chunks, { type: mimeType })
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
