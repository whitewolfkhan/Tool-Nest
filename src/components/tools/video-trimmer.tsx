'use client'

import * as React from 'react'
import {
  Upload,
  Download,
  Play,
  Pause,
  Scissors,
  Film,
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
import { formatTime, formatFileSize, pickSupportedMimeTypes } from '@/lib/audio-utils'

export default function VideoTrimmer() {
  const [file, setFile] = React.useState<File | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [outputUrl, setOutputUrl] = React.useState<string>('')
  const [outputSize, setOutputSize] = React.useState<number>(0)
  const [start, setStart] = React.useState(0)
  const [end, setEnd] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
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
    setStart(0)
    setEnd(0)
    setCurrentTime(0)
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

  // When metadata loads, set duration and end
  function handleLoadedMetadata() {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration)
    setEnd(v.duration)
  }

  React.useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => setCurrentTime(v.currentTime)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd = () => setIsPlaying(false)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('ended', onEnd)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('ended', onEnd)
    }
  }, [objectUrl])

  // Stop playback at end if a selection is set
  React.useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isPlaying && end > 0 && end < duration - 0.05 && v.currentTime >= end) {
      v.pause()
      v.currentTime = start
    }
  }, [currentTime, end, isPlaying, duration, start])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (isPlaying) v.pause()
    else v.play().catch(() => toast.error('Playback failed'))
  }

  function playSelection() {
    const v = videoRef.current
    if (!v) return
    v.currentTime = start
    v.play().catch(() => toast.error('Playback failed'))
  }

  async function handleTrim() {
    if (!file || !videoRef.current || duration === 0) return
    if (end - start < 0.1) {
      toast.error('Selection too short')
      return
    }
    setProcessing(true)
    setProgress(0)
    try {
      const blob = await recordVideoSegment(
        videoRef.current,
        start,
        end,
        (p) => setProgress(p)
      )
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      setOutputUrl(URL.createObjectURL(blob))
      setOutputSize(blob.size)
      toast.success(`Trimmed video ready (${formatFileSize(blob.size)})`)
    } catch (err) {
      console.error(err)
      toast.error(
        err instanceof Error ? err.message : 'Failed to trim video'
      )
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
    setStart(0)
    setEnd(0)
    setDuration(0)
    setCurrentTime(0)
  }

  function downloadOutput() {
    if (!outputUrl) return
    const a = document.createElement('a')
    a.href = outputUrl
    const baseName = file?.name.replace(/\.[^.]+$/, '') || 'video'
    a.download = `${baseName}-trimmed.webm`
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
                    {formatFileSize(file.size)} · {formatTime(duration)} · {file.type || 'video'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                <RefreshCw className="h-4 w-4" />
                New file
              </Button>
            </div>

            {/* Video preview */}
            <div className="rounded-lg overflow-hidden border border-border bg-black">
              <video
                ref={videoRef}
                src={objectUrl}
                onLoadedMetadata={handleLoadedMetadata}
                controls
                playsInline
                className="w-full max-h-[420px]"
              />
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={togglePlay}
                size="sm"
                className="gap-1.5 bg-teal-600 hover:bg-teal-700"
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
              <Button onClick={playSelection} size="sm" variant="outline" className="gap-1.5">
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
                  Start: <span className="text-teal-600 font-mono">{formatTime(start)}</span>
                </FieldLabel>
                <Slider
                  value={[start]}
                  min={0}
                  max={duration}
                  step={0.05}
                  onValueChange={(v) => {
                    const next = Math.min(v[0], end - 0.1)
                    setStart(Math.max(0, next))
                    if (videoRef.current) videoRef.current.currentTime = Math.max(0, next)
                  }}
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
                  step={0.05}
                  onValueChange={(v) => {
                    const next = Math.max(v[0], start + 0.1)
                    setEnd(Math.min(duration, next))
                    if (videoRef.current) videoRef.current.currentTime = Math.min(duration, next)
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
                <p className="text-lg font-semibold text-teal-600">
                  {formatTime(Math.max(0, end - start))}
                </p>
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleTrim}
                disabled={processing || end - start < 0.1}
                className="gap-1.5 bg-teal-600 hover:bg-teal-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Scissors className="h-4 w-4" />
                )}
                {processing ? 'Trimming…' : 'Trim video'}
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
                  Recording segment in real time… {Math.round(progress)}%
                </p>
              </div>
            )}

            {outputUrl && !processing && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-xs text-muted-foreground mb-1">Preview trimmed video</p>
                <video src={outputUrl} controls className="w-full rounded-md max-h-[420px]" />
              </div>
            )}
          </div>
        )}
        {!file && (
          <div className="mt-4">
            <EmptyState message="Upload a video file to start trimming." />
          </div>
        )}
      </ToolCardWrapper>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How trimming works</p>
        <p>
          We play the video segment from <code>start</code> to <code>end</code> in real time while
          drawing frames to a canvas and capturing the canvas stream + audio track with{' '}
          <code>MediaRecorder</code>. The output is a WebM file (VP9/VP8 + Opus). Trimming takes
          as long as the clip length itself — it&apos;s a real-time capture, not a fast mux.
        </p>
      </div>
    </div>
  )
}

/**
 * Record a video segment by playing the video from start to end while drawing
 * frames to a canvas and capturing the canvas + audio track.
 */
async function recordVideoSegment(
  video: HTMLVideoElement,
  startSec: number,
  endSec: number,
  onProgress: (p: number) => void
): Promise<Blob> {
  // Mute the visible video so the user doesn't hear double audio — but we still
  // capture the audio track via captureStream().
  const wasMuted = video.muted
  const wasVolume = video.volume
  video.muted = true
  video.volume = 0

  // Wait for the video to be ready
  if (video.readyState < 2) {
    await new Promise<void>((resolve) => {
      const onReady = () => {
        video.removeEventListener('loadeddata', onReady)
        resolve()
      }
      video.addEventListener('loadeddata', onReady)
    })
  }

  // Seek to start
  await seekTo(video, startSec)

  // Set up canvas at the video's intrinsic size (capped to 1280 wide for performance)
  const vw = video.videoWidth || 640
  const vh = video.videoHeight || 480
  const maxW = 1280
  const scale = Math.min(1, maxW / vw)
  const cw = Math.round(vw * scale)
  const ch = Math.round(vh * scale)

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  // Build combined stream from canvas + audio track from video element
  const fps = 30
  const canvasStream = canvas.captureStream(fps)
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

  // Draw loop using requestAnimationFrame
  let drawing = true
  const draw = () => {
    if (!drawing) return
    if (!video.paused && !video.ended) {
      ctx.drawImage(video, 0, 0, cw, ch)
    }
    const progress = Math.min(
      100,
      Math.max(0, ((video.currentTime - startSec) / (endSec - startSec)) * 100)
    )
    onProgress(progress)
    if (video.currentTime >= endSec || video.ended) {
      drawing = false
      if (recorder.state !== 'inactive') recorder.stop()
      return
    }
    requestAnimationFrame(draw)
  }

  // Start recording and playback
  recorder.start(100)
  video.play().catch(() => {})
  requestAnimationFrame(draw)

  // Safety timeout (in case onProgress never fires the stop)
  const safety = new Promise<void>((resolve) => {
    setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop()
      resolve()
    }, (endSec - startSec) * 1000 + 3000)
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
