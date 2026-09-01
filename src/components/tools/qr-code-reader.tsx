'use client'

import * as React from 'react'
import {
  Upload,
  Camera,
  CameraOff,
  Copy,
  Check,
  Trash2,
  QrCode,
  ScanLine,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

interface HistoryItem {
  id: string
  text: string
  format: string
  ts: number
}

// Use any for BarcodeDetector — not in TS DOM lib by default
type BarcodeDetectorLike = {
  detect(source: CanvasImageSource): Promise<{ rawValue: string; format: string }[]>
}

function getBarcodeDetectorCtor(): any | null {
  if (typeof window === 'undefined') return null
  const w = window as any
  return w.BarcodeDetector ?? null
}

export default function QrCodeReader() {
  const [result, setResult] = React.useState<string>('')
  const [resultFormat, setResultFormat] = React.useState<string>('')
  const [history, setHistory] = React.useState<HistoryItem[]>([])
  const [scanning, setScanning] = React.useState(false)
  const [cameraOn, setCameraOn] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const fileRef = React.useRef<HTMLInputElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const rafRef = React.useRef<number | null>(null)
  const detectorRef = React.useRef<BarcodeDetectorLike | null>(null)
  const [dragOver, setDragOver] = React.useState(false)

  const DetectorCtor = getBarcodeDetectorCtor()
  const supported = !!DetectorCtor
  const [cameraSupported, setCameraSupported] = React.useState(false)

  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      setCameraSupported(true)
    }
  }, [])

  const pushHistory = (text: string, format: string) => {
    const item: HistoryItem = {
      id: Math.random().toString(36).slice(2, 9),
      text,
      format,
      ts: Date.now(),
    }
    setHistory((prev) => [item, ...prev].slice(0, 20))
  }

  const detectFromCanvas = React.useCallback(async (canvas: HTMLCanvasElement): Promise<boolean> => {
    if (!DetectorCtor) return false
    try {
      if (!detectorRef.current) {
        // Build supported formats list (most browsers support a default list)
        detectorRef.current = new DetectorCtor()
      }
      const codes = await detectorRef.current.detect(canvas)
      if (codes.length > 0) {
        const c = codes[0]!
        setResult(c.rawValue)
        setResultFormat(c.format || 'qr_code')
        pushHistory(c.rawValue, c.format || 'qr_code')
        return true
      }
    } catch (err) {
      console.error('decode error', err)
    }
    return false
  }, [DetectorCtor])

  const handleFile = async (file: File) => {
    if (!supported) {
      toast.error('BarcodeDetector API not available in your browser. Try Chrome or Edge.')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = async () => {
      const canvas = canvasRef.current ?? document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const ok = await detectFromCanvas(canvas)
      if (ok) {
        toast.success('QR code decoded!')
      } else {
        toast.error('No QR code found in the image')
      }
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      toast.error('Failed to load image')
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const onPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile()
        if (f) {
          handleFile(f)
          break
        }
      }
    }
  }

  const stopCamera = React.useCallback(() => {
    setScanning(false)
    setCameraOn(false)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const startCamera = async () => {
    if (!supported) {
      toast.error('BarcodeDetector API not supported. Try Chrome or Edge.')
      return
    }
    if (!cameraSupported) {
      toast.error('Camera API not supported in this browser')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
      setScanning(true)

      const tick = async () => {
        if (!scanningRef.current) return
        const v = videoRef.current
        if (v && v.videoWidth > 0) {
          const canvas = canvasRef.current ?? document.createElement('canvas')
          canvas.width = v.videoWidth
          canvas.height = v.videoHeight
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(v, 0, 0)
          const ok = await detectFromCanvas(canvas)
          if (ok) {
            stopCamera()
            return
          }
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      // use a ref to track scanning state inside the loop
      scanningRef.current = true
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      console.error(err)
      toast.error('Failed to access camera. Please grant permission.')
      setCameraOn(false)
      setScanning(false)
    }
  }

  const scanningRef = React.useRef(false)
  React.useEffect(() => {
    scanningRef.current = scanning
  }, [scanning])

  React.useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const onCopy = async () => {
    if (!result) {
      toast.error('Nothing to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      toast.success('Result copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const onClear = () => {
    setResult('')
    setResultFormat('')
  }

  const onClearHistory = () => setHistory([])

  return (
    <div className="space-y-6" onPaste={onPaste}>
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Upload + camera */}
          <div className="space-y-4">
            <div>
              <FieldLabel>Upload QR image</FieldLabel>
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={onDrop}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/60 hover:bg-accent'
                }`}
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click, drop, or paste an image</p>
                <p className="text-xs text-muted-foreground mt-1">PNG / JPG / WebP</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onInputChange}
                  className="hidden"
                />
              </div>
            </div>

            <Separator />

            <div>
              <FieldLabel>Or scan with camera</FieldLabel>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${cameraOn ? 'block' : 'hidden'}`}
                />
                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-xs">Camera preview will appear here</p>
                  </div>
                )}
                {scanning && (
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_8px_2px] shadow-emerald-400/50 animate-pulse" />
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {!cameraOn ? (
                  <Button onClick={startCamera} variant="outline" className="gap-1.5">
                    <Camera className="h-4 w-4" />
                    Start camera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="destructive" className="gap-1.5">
                    <CameraOff className="h-4 w-4" />
                    Stop camera
                  </Button>
                )}
                <Button
                  onClick={onClear}
                  variant="ghost"
                  className="gap-1.5"
                  disabled={!result && !cameraOn}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {!supported && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                <Info className="h-3.5 w-3.5 inline mr-1" />
                Your browser does not support the <code className="font-mono">BarcodeDetector</code> API.
                Please use Chrome 83+ or Edge 83+ on desktop/Android. iOS Safari does not yet support it.
              </div>
            )}
          </div>

          {/* Right: Result */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <ScanLine className="h-4 w-4 text-primary" />
                Decoded result
              </h3>
              {resultFormat && (
                <Badge variant="secondary" className="uppercase">{resultFormat}</Badge>
              )}
            </div>

            {!result ? (
              <EmptyState message="Upload an image with a QR code, or scan with your camera to see the decoded text here." />
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  rows={6}
                  className="resize-y font-mono text-sm"
                  placeholder="Decoded text will appear here"
                />
                <div className="flex items-center gap-2">
                  <Button onClick={onCopy} variant="outline" size="sm" className="gap-1.5">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  {/^https?:\/\//i.test(result) && (
                    <Button asChild variant="outline" size="sm">
                      <a href={result} target="_blank" rel="noopener noreferrer">
                        Open link
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* History */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Session history ({history.length})
                </h4>
                {history.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={onClearHistory} className="h-6 text-xs">
                    Clear
                  </Button>
                )}
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No scanned codes yet.</p>
                ) : (
                  history.map((h) => (
                    <div
                      key={h.id}
                      className="rounded-md border border-border bg-muted/30 p-2.5 cursor-pointer hover:bg-accent"
                      onClick={() => {
                        setResult(h.text)
                        setResultFormat(h.format)
                      }}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <Badge variant="outline" className="text-[10px] uppercase">{h.format || 'qr_code'}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(h.ts).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="font-mono text-xs truncate">{h.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </ToolCardWrapper>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-primary" />
          How it works
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>This tool uses the native <code className="font-mono">BarcodeDetector</code> browser API — no third-party libraries, no uploads.</li>
          <li>All image processing happens locally in your browser. Your QR codes and camera feed never leave your device.</li>
          <li>Camera scanning requires HTTPS (or localhost) and camera permission. Use the rear camera on mobile for best results.</li>
          <li>The BarcodeDetector API is currently available in Chrome and Edge. Safari and Firefox users should upload an image instead.</li>
        </ul>
      </div>
    </div>
  )
}
