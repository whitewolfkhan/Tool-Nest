'use client'

import * as React from 'react'
import JSZip from 'jszip'
import {
  Upload,
  Download,
  Film,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  Grid3x3,
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
import { Input } from '@/components/ui/input'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
  DownloadButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatTime, formatFileSize } from '@/lib/audio-utils'

type Mode = 'every-nth' | 'timestamps' | 'evenly'

interface FrameItem {
  index: number
  time: number
  dataUrl: string
  blob: Blob
}

export default function VideoFrameExtractor() {
  const [file, setFile] = React.useState<File | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [frames, setFrames] = React.useState<FrameItem[]>([])
  const [duration, setDuration] = React.useState(0)
  const [videoDims, setVideoDims] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [dragOver, setDragOver] = React.useState(false)

  const [mode, setMode] = React.useState<Mode>('evenly')
  const [nthFrame, setNthFrame] = React.useState(10)
  const [frameCount, setFrameCount] = React.useState(10)
  const [timestamps, setTimestamps] = React.useState('1, 2, 5, 10')

  const videoRef = React.useRef<HTMLVideoElement | null>(null)

  React.useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  function loadFile(f: File) {
    setLoading(true)
    setFrames([])
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

  async function handleExtract() {
    if (!file || !videoRef.current || duration === 0) return
    setProcessing(true)
    setProgress(0)
    setFrames([])
    try {
      const times = computeTimes(mode, nthFrame, frameCount, timestamps, duration)
      if (times.length === 0) {
        toast.error('No frames to extract — check your settings')
        return
      }
      const result = await extractFrames(videoRef.current, times, (p) => setProgress(p))
      setFrames(result)
      toast.success(`Extracted ${result.length} frames`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Frame extraction failed')
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  async function downloadAll() {
    if (frames.length === 0) return
    try {
      const zip = new JSZip()
      const baseName = (file?.name.replace(/\.[^.]+$/, '') || 'video').slice(0, 40)
      frames.forEach((f, i) => {
        const num = String(i + 1).padStart(String(frames.length).length, '0')
        zip.file(`${baseName}-frame-${num}.png`, f.blob)
      })
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${baseName}-frames.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${frames.length} frames as ZIP`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to create ZIP')
    }
  }

  function downloadOne(frame: FrameItem) {
    const a = document.createElement('a')
    a.href = frame.dataUrl
    a.download = `frame-${frame.index + 1}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Downloaded')
  }

  function reset() {
    setFile(null)
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setObjectUrl('')
    setFrames([])
    setDuration(0)
    setVideoDims({ w: 0, h: 0 })
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
              Extract frames as PNG images — 100% in your browser
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

            <div>
              <FieldLabel>Extraction mode</FieldLabel>
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evenly">
                    Evenly spaced (N frames)
                  </SelectItem>
                  <SelectItem value="every-nth">
                    Every Nth second
                  </SelectItem>
                  <SelectItem value="timestamps">
                    Specific timestamps (comma-separated seconds)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === 'evenly' && (
              <div>
                <FieldLabel>Number of frames to extract</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={frameCount}
                  onChange={(e) => setFrameCount(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            )}

            {mode === 'every-nth' && (
              <div>
                <FieldLabel>Extract every N seconds</FieldLabel>
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={nthFrame}
                  onChange={(e) => setNthFrame(Math.max(0.1, Number(e.target.value) || 1))}
                />
              </div>
            )}

            {mode === 'timestamps' && (
              <div>
                <FieldLabel>Timestamps (in seconds, comma-separated)</FieldLabel>
                <Input
                  type="text"
                  value={timestamps}
                  onChange={(e) => setTimestamps(e.target.value)}
                  placeholder="e.g. 1, 2.5, 5, 10"
                />
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleExtract}
                disabled={processing}
                className="gap-1.5 bg-teal-600 hover:bg-teal-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Grid3x3 className="h-4 w-4" />
                )}
                {processing ? 'Extracting…' : 'Extract frames'}
              </Button>
              {frames.length > 0 && (
                <DownloadButton
                  onClick={downloadAll}
                  label={`Download all (${frames.length} PNGs as ZIP)`}
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
                  Seeking & extracting… {Math.round(progress)}%
                </p>
              </div>
            )}

            {frames.length > 0 && !processing && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-emerald-600">
                    {frames.length} frames extracted
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[480px] overflow-y-auto pr-1">
                  {frames.map((f) => (
                    <div
                      key={f.index}
                      className="group relative rounded-md overflow-hidden border border-border bg-black/5"
                    >
                      <img
                        src={f.dataUrl}
                        alt={`Frame ${f.index + 1}`}
                        className="w-full aspect-video object-contain"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                        <span className="text-[10px] text-white font-mono">
                          {formatTime(f.time)}
                        </span>
                        <button
                          onClick={() => downloadOne(f)}
                          className="text-white/80 hover:text-white"
                          aria-label="Download frame"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {!file && (
          <div className="mt-4">
            <EmptyState message="Upload a video to extract frames as PNG images." />
          </div>
        )}
      </ToolCardWrapper>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How frame extraction works</p>
        <p>
          We seek the video to each target time, draw the frame to a canvas, and save it as a PNG.
          You can extract a fixed number of evenly-spaced frames, one every N seconds, or at exact
          timestamps. All frames are downloaded together as a ZIP archive using JSZip.
        </p>
      </div>
    </div>
  )
}

function computeTimes(
  mode: Mode,
  nth: number,
  count: number,
  timestamps: string,
  duration: number
): number[] {
  if (mode === 'evenly') {
    if (count <= 1) return [0]
    const step = duration / (count + 1)
    return Array.from({ length: count }, (_, i) => i * step)
  }
  if (mode === 'every-nth') {
    const times: number[] = []
    for (let t = 0; t <= duration; t += nth) times.push(t)
    return times
  }
  // timestamps
  return timestamps
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n) && n >= 0 && n <= duration)
}

async function extractFrames(
  video: HTMLVideoElement,
  times: number[],
  onProgress: (p: number) => void
): Promise<FrameItem[]> {
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
  // Cap dimension at 1280 wide for memory safety
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
  video.muted = true

  const out: FrameItem[] = []
  for (let i = 0; i < times.length; i++) {
    const t = times[i]
    await seekTo(video, t)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, cw, ch)
    ctx.drawImage(video, 0, 0, cw, ch)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/png',
        0.92
      )
    })
    const dataUrl = canvas.toDataURL('image/png')
    out.push({ index: i, time: t, dataUrl, blob })
    onProgress(Math.round(((i + 1) / times.length) * 100))
    // Yield occasionally
    if (i % 2 === 0) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  video.muted = wasMuted
  return out
}

function seekTo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
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
