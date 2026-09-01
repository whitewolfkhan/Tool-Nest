'use client'

import * as React from 'react'
import {
  Mic,
  Square,
  Play,
  Pause,
  Download,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ToolCardWrapper,
  EmptyState,
  DownloadButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatTime, formatFileSize, pickSupportedMimeTypes } from '@/lib/audio-utils'

type RecorderState = 'idle' | 'recording' | 'stopped'

export default function AudioRecorder() {
  const [state, setState] = React.useState<RecorderState>('idle')
  const [elapsed, setElapsed] = React.useState(0)
  const [level, setLevel] = React.useState(0)
  const [outputUrl, setOutputUrl] = React.useState<string>('')
  const [outputSize, setOutputSize] = React.useState(0)
  const [outputType, setOutputType] = React.useState<string>('')
  const [outputExt, setOutputExt] = React.useState<string>('webm')
  const [permissionError, setPermissionError] = React.useState<string>('')
  const [isPlaying, setIsPlaying] = React.useState(false)

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const audioCtxRef = React.useRef<AudioContext | null>(null)
  const analyserRef = React.useRef<AnalyserNode | null>(null)
  const rafRef = React.useRef<number | null>(null)
  const chunksRef = React.useRef<BlobPart[]>([])
  const startTimeRef = React.useRef<number>(0)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  function stopAll(silent: boolean) {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    analyserRef.current = null
    if (!silent) {
      setState('idle')
    }
  }

  React.useEffect(() => {
    return () => {
      stopAll(true)
    }
  }, [])

  React.useEffect(() => {
    return () => {
      if (outputUrl) URL.revokeObjectURL(outputUrl)
    }
  }, [outputUrl])

  async function startRecording() {
    setPermissionError('')
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermissionError('Your browser does not support microphone recording.')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream

      // Pick best supported audio mimeType
      const mimeType =
        pickSupportedMimeTypes([
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
        ]) ?? ''

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      )
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        })
        if (outputUrl) URL.revokeObjectURL(outputUrl)
        setOutputUrl(URL.createObjectURL(blob))
        setOutputSize(blob.size)
        setOutputType(blob.type)
        const ext = blob.type.includes('mp4')
          ? 'm4a'
          : blob.type.includes('ogg')
            ? 'ogg'
            : 'webm'
        setOutputExt(ext)
        toast.success(`Recording saved (${formatFileSize(blob.size)})`)
      }
      mediaRecorderRef.current = recorder

      // Set up audio level meter
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / data.length)
        setLevel(Math.min(1, rms * 3))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()

      recorder.start(100) // collect data every 100ms
      setState('recording')
      startTimeRef.current = Date.now()
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000)
      }, 100)
      toast.success('Recording started')
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setPermissionError(
          'Microphone access was denied. Please allow microphone permissions in your browser settings and try again.'
        )
      } else {
        setPermissionError(`Failed to access microphone: ${msg}`)
      }
      stopAll(false)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    stopAll(false)
    setState('stopped')
    setLevel(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function reset() {
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setOutputUrl('')
    setOutputSize(0)
    setOutputType('')
    setElapsed(0)
    setState('idle')
  }

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.currentTime = 0
      audio.play().catch(() => toast.error('Playback failed'))
    }
  }

  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd = () => setIsPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnd)
    }
  }, [outputUrl])

  function downloadOutput() {
    if (!outputUrl) return
    const a = document.createElement('a')
    a.href = outputUrl
    a.download = `recording-${Date.now()}.${outputExt}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Download started')
  }

  const isRecording = state === 'recording'

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        {/* Permission error */}
        {permissionError && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 flex items-start gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Microphone unavailable
              </p>
              <p className="text-xs text-muted-foreground mt-1">{permissionError}</p>
            </div>
          </div>
        )}

        {/* Mic visualization */}
        <div className="flex flex-col items-center py-6">
          <div
            className={cn(
              'relative flex h-32 w-32 items-center justify-center rounded-full transition-all',
              isRecording
                ? 'bg-fuchsia-500/10'
                : outputUrl
                  ? 'bg-emerald-500/10'
                  : 'bg-muted'
            )}
          >
            {/* Pulse rings */}
            {isRecording && (
              <>
                <span
                  className="absolute inset-0 rounded-full bg-fuchsia-500/20 animate-ping"
                  style={{ animationDuration: '1.5s' }}
                />
                <span
                  className="absolute rounded-full bg-fuchsia-500/20"
                  style={{
                    inset: `${8 + (1 - level) * 16}px`,
                    transition: 'inset 80ms',
                  }}
                />
              </>
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={state !== 'idle' && state !== 'recording' && !isRecording}
              className={cn(
                'relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-all',
                isRecording
                  ? 'bg-fuchsia-600 hover:bg-fuchsia-700 scale-105'
                  : 'bg-fuchsia-600 hover:bg-fuchsia-700'
              )}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? (
                <Square className="h-7 w-7" fill="currentColor" />
              ) : (
                <Mic className="h-9 w-9" />
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            {isRecording ? (
              <>
                <p className="text-2xl font-mono font-semibold tabular-nums text-fuchsia-600">
                  {formatTime(elapsed)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Recording…</p>
              </>
            ) : outputUrl ? (
              <>
                <p className="text-2xl font-mono font-semibold tabular-nums text-emerald-600">
                  {formatTime(elapsed)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Recording saved</p>
              </>
            ) : (
              <>
                <p className="text-base font-medium">Ready to record</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click the mic to start. Your audio stays on your device.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Level meter */}
        {isRecording && (
          <div className="mt-2">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 to-rose-500 transition-all duration-75"
                style={{ width: `${Math.min(100, level * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Level: {Math.round(level * 100)}%
            </p>
          </div>
        )}

        {/* Playback + download */}
        {outputUrl && !isRecording && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Button
                  onClick={togglePlay}
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
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
                <Badge variant="secondary" className="uppercase">
                  {outputExt}
                </Badge>
                <Badge variant="outline">{formatFileSize(outputSize)}</Badge>
              </div>
              <div className="flex gap-2">
                <DownloadButton onClick={downloadOutput} label="Download" />
                <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                  <RefreshCw className="h-4 w-4" /> Discard
                </Button>
              </div>
            </div>
            <audio ref={audioRef} src={outputUrl} className="hidden" />
            <p className="text-xs text-muted-foreground">
              Format: <code>{outputType || 'audio/webm'}</code> · Mic input only (no system
              audio).
            </p>
          </div>
        )}

        {!outputUrl && !isRecording && !permissionError && (
          <div className="mt-4">
            <EmptyState message="Press the microphone button to start recording from your mic." />
          </div>
        )}
      </ToolCardWrapper>

      <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">About recording formats</p>
        <p>
          Browser recording uses the <code>MediaRecorder</code> API. The output format depends
          on your browser — most modern browsers produce <strong>WebM/Opus</strong> (.webm).
          Safari may produce MP4/AAC (.m4a) instead. MP3 is not supported by browsers for
          recording. The recording is never uploaded — it lives entirely in your browser.
        </p>
      </div>
    </div>
  )
}
