'use client'

import * as React from 'react'
import { Upload, X, ImageIcon, Camera, MapPin, Calendar, FileText, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ToolCardWrapper, EmptyState } from '@/components/tool-page-shell'
import { toast } from 'sonner'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)))
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

interface ExifTag {
  label: string
  value: string
}

// Minimal EXIF reader: parses JPEG APP1 (Exif) IFD0 + ExifIFD for common tags
function readExif(arrayBuffer: ArrayBuffer): Record<string, string> {
  const view = new DataView(arrayBuffer)
  const result: Record<string, string> = {}
  // Find APP1 marker
  if (view.getUint16(0) !== 0xffd8) return result
  let offset = 2
  let app1Offset = -1
  while (offset < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break
    const marker = view.getUint16(offset)
    const size = view.getUint16(offset + 2)
    if (marker === 0xffe1) {
      // APP1 — check 'Exif\0\0' signature
      const sig = view.getUint32(offset + 4)
      if (sig === 0x45786966 && view.getUint16(offset + 8) === 0x0000) {
        app1Offset = offset + 10
        break
      }
    }
    offset += 2 + size
  }
  if (app1Offset === -1) return result

  const tiff = app1Offset
  const byteOrder = view.getUint16(tiff)
  const little = byteOrder === 0x4949
  if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return result

  const getU16 = (off: number) =>
    little ? view.getUint16(off, true) : view.getUint16(off, false)
  const getU32 = (off: number) =>
    little ? view.getUint32(off, true) : view.getUint32(off, false)

  const ifd0Offset = tiff + getU32(tiff + 4)
  const numEntries = getU16(ifd0Offset)

  let exifIFDOffset = 0
  let gpsIFDOffset = 0

  const readTagValue = (tagOffset: number, type: number, count: number, valueOffset: number): string => {
    try {
      if (type === 2) {
        // ASCII
        let off = count <= 4 ? tagOffset + 8 : valueOffset
        let str = ''
        for (let i = 0; i < count; i++) {
          const c = view.getUint8(off + i)
          if (c === 0) break
          str += String.fromCharCode(c)
        }
        return str
      }
      if (type === 3 && count === 1) {
        // SHORT
        return String(getU16(count <= 2 ? tagOffset + 8 : valueOffset))
      }
      if (type === 4 && count === 1) {
        // LONG
        return String(getU32(count <= 1 ? tagOffset + 8 : valueOffset))
      }
      if (type === 5 && count === 2) {
        // RATIONAL (numerator/denominator)
        const num = getU32(valueOffset)
        const den = getU32(valueOffset + 4)
        if (den === 0) return '0'
        // For some tags we want fractional (aperture)
        const val = num / den
        return Number.isInteger(val) ? `${val}` : val.toFixed(2)
      }
      if (type === 5 && count === 3) {
        // 3 rationals (GPS lat/long)
        const parts: string[] = []
        for (let i = 0; i < 3; i++) {
          const num = getU32(valueOffset + i * 8)
          const den = getU32(valueOffset + i * 8 + 4)
          parts.push(den === 0 ? '0' : (num / den).toFixed(6))
        }
        return parts.join(', ')
      }
      if (type === 7 && count === 2) {
        // UNDEFINED — sometimes used for time
        return ''
      }
      return ''
    } catch {
      return ''
    }
  }

  // Tag definitions
  const TAGS: Record<number, string> = {
    0x010f: 'Make',
    0x0110: 'Model',
    0x0112: 'Orientation',
    0x011a: 'XResolution',
    0x011b: 'YResolution',
    0x0131: 'Software',
    0x0132: 'DateTime',
    0x013e: 'WhitePoint',
    0x8769: 'ExifIFD',
    0x8825: 'GPSInfo',
  }
  const EXIF_TAGS: Record<number, string> = {
    0x829a: 'ExposureTime',
    0x829d: 'FNumber',
    0x9003: 'DateTimeOriginal',
    0x9004: 'DateTimeDigitized',
    0x9201: 'ShutterSpeedValue',
    0x9202: 'ApertureValue',
    0x9204: 'ExposureBiasValue',
    0x9207: 'MeteringMode',
    0x9209: 'Flash',
    0xa002: 'PixelXDimension',
    0xa003: 'PixelYDimension',
    0xa210: 'FocalPlaneResolutionUnit',
    0xa215: 'ExposureIndex',
    0xa300: 'FileSource',
    0xa301: 'SceneType',
    0x920a: 'FocalLength',
    0x8827: 'ISO',
  }
  const GPS_TAGS: Record<number, string> = {
    0x0001: 'GPSLatitudeRef',
    0x0002: 'GPSLatitude',
    0x0003: 'GPSLongitudeRef',
    0x0004: 'GPSLongitude',
    0x0005: 'GPSAltitudeRef',
    0x0006: 'GPSAltitude',
  }

  const readIFD = (ifdOffset: number, tags: Record<number, string>, target: Record<string, string>) => {
    const n = getU16(ifdOffset)
    for (let i = 0; i < n; i++) {
      const entryOffset = ifdOffset + 2 + i * 12
      const tag = getU16(entryOffset)
      const type = getU16(entryOffset + 2)
      const count = getU32(entryOffset + 4)
      const valueOffset = getU32(entryOffset + 8)
      const tagName = tags[tag]
      if (!tagName) continue
      if (tagName === 'ExifIFD') {
        exifIFDOffset = tiff + valueOffset
        continue
      }
      if (tagName === 'GPSInfo') {
        gpsIFDOffset = tiff + valueOffset
        continue
      }
      const value = readTagValue(entryOffset, type, count, tiff + valueOffset)
      if (value) target[tagName] = value
    }
  }

  readIFD(ifd0Offset, TAGS, result)
  if (exifIFDOffset) readIFD(exifIFDOffset, EXIF_TAGS, result)
  if (gpsIFDOffset) readIFD(gpsIFDOffset, GPS_TAGS, result)

  return result
}

function gpsToDecimal(value: string, ref: string): string | null {
  const parts = value.split(',').map((v) => parseFloat(v.trim()))
  if (parts.length !== 3 || parts.some(isNaN)) return null
  const dec = parts[0] + parts[1] / 60 + parts[2] / 3600
  const signed = ref === 'S' || ref === 'W' ? -dec : dec
  return signed.toFixed(6)
}

export default function ImageMetadata() {
  const [file, setFile] = React.useState<File | null>(null)
  const [imageUrl, setImageUrl] = React.useState<string>('')
  const [width, setWidth] = React.useState(0)
  const [height, setHeight] = React.useState(0)
  const [exif, setExif] = React.useState<Record<string, string>>({})
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    setFile(f)
    const url = URL.createObjectURL(f)
    setImageUrl(url)
    setExif({})
    const img = new Image()
    img.onload = () => {
      setWidth(img.naturalWidth)
      setHeight(img.naturalHeight)
    }
    img.src = url
    // Try to read EXIF (only meaningful for JPEG)
    if (f.type === 'image/jpeg') {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = readExif(reader.result as ArrayBuffer)
          // Compute GPS lat/long if present
          if (data.GPSLatitude && data.GPSLongitude) {
            const lat = gpsToDecimal(data.GPSLatitude, data.GPSLatitudeRef || 'N')
            const lng = gpsToDecimal(data.GPSLongitude, data.GPSLongitudeRef || 'E')
            if (lat && lng) {
              data.GPSDecimal = `${lat}, ${lng}`
            }
          }
          // Format ExposureTime as fraction (e.g. 1/250s)
          if (data.ExposureTime) {
            const v = parseFloat(data.ExposureTime)
            if (v > 0 && v < 1) {
              data.ExposureTime = `1/${Math.round(1 / v)} s`
            } else {
              data.ExposureTime = `${v} s`
            }
          }
          if (data.FNumber) data.FNumber = `f/${parseFloat(data.FNumber).toFixed(1)}`
          if (data.FocalLength) data.FocalLength = `${parseFloat(data.FocalLength).toFixed(0)} mm`
          if (data.ISO) data.ISO = data.ISO
          setExif(data)
        } catch {
          setExif({})
        }
      }
      reader.readAsArrayBuffer(f)
    }
  }

  React.useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const reset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setFile(null)
    setImageUrl('')
    setExif({})
    setWidth(0)
    setHeight(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  const fileInfo: ExifTag[] = file
    ? [
        { label: 'File name', value: file.name },
        { label: 'File type', value: file.type || 'unknown' },
        { label: 'File size', value: formatBytes(file.size) },
        { label: 'Dimensions', value: `${width}×${height} px` },
        { label: 'Megapixels', value: width && height ? `${((width * height) / 1_000_000).toFixed(1)} MP` : '—' },
        { label: 'Last modified', value: new Date(file.lastModified).toLocaleString() },
      ]
    : []

  const cameraTags: ExifTag[] = [
    'Make',
    'Model',
    'Software',
    'DateTime',
    'DateTimeOriginal',
    'ExposureTime',
    'FNumber',
    'ISO',
    'FocalLength',
    'ExposureBiasValue',
    'MeteringMode',
    'Flash',
    'Orientation',
  ]
    .map((k) => ({ label: k, value: exif[k] }))
    .filter((t) => t.value) as ExifTag[]

  const gpsTags: ExifTag[] = [
    { label: 'Latitude', value: exif.GPSLatitudeRef ? `${exif.GPSLatitude} (${exif.GPSLatitudeRef})` : '' },
    { label: 'Longitude', value: exif.GPSLongitudeRef ? `${exif.GPSLongitude} (${exif.GPSLongitudeRef})` : '' },
    { label: 'Decimal', value: exif.GPSDecimal || '' },
    { label: 'Altitude', value: exif.GPSAltitude || '' },
  ].filter((t) => t.value)

  const mapsLink = exif.GPSDecimal
    ? `https://www.google.com/maps?q=${exif.GPSDecimal}`
    : null

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolCardWrapper>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Upload Image</h2>
            {file && (
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                <X className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
          {!file ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-12 px-4 cursor-pointer transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drag & drop image here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse · JPEG recommended for EXIF</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
                <img src={imageUrl} alt="Source" className="w-full h-auto max-h-72 object-contain" />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 truncate">
                  <ImageIcon className="h-3.5 w-3.5" /> {file.name}
                </span>
                <Badge variant="outline" className="uppercase">
                  {file.type.split('/')[1] || 'image'}
                </Badge>
              </div>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Info className="h-4 w-4" /> Image Metadata
          </h2>
          {!file ? (
            <EmptyState message="Upload an image to view its metadata" />
          ) : (
            <ScrollArea className="max-h-[480px] pr-3">
              <div className="space-y-4">
                <Section title="File Information" icon={<FileText className="h-4 w-4" />} rows={fileInfo} />
                <Separator />
                <Section
                  title="Camera & EXIF"
                  icon={<Camera className="h-4 w-4" />}
                  rows={cameraTags}
                  emptyMessage="No EXIF data found (most common with PNG/WebP images)"
                />
                {gpsTags.length > 0 && (
                  <>
                    <Separator />
                    <Section title="GPS Location" icon={<MapPin className="h-4 w-4" />} rows={gpsTags} />
                    {mapsLink && (
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <MapPin className="h-4 w-4" /> View on Google Maps
                      </a>
                    )}
                  </>
                )}
                <Separator />
                <Section
                  title="Capture Date"
                  icon={<Calendar className="h-4 w-4" />}
                  rows={[{ label: 'Original', value: exif.DateTimeOriginal || '—' }]}
                />
              </div>
            </ScrollArea>
          )}
        </div>
      </ToolCardWrapper>
    </div>
  )
}

function Section({
  title,
  icon,
  rows,
  emptyMessage,
}: {
  title: string
  icon: React.ReactNode
  rows: ExifTag[]
  emptyMessage?: string
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
        {icon}
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground pl-6">{emptyMessage || 'No data'}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
          {rows.map((r) => (
            <div key={r.label} className="rounded-md border border-border bg-muted/30 p-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{r.label}</p>
              <p className="text-xs font-medium break-words">{r.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
