'use client'

import * as React from 'react'
import QRCode from 'qrcode'
import { QrCode, Download, Wifi, User, Link as LinkIcon, Type } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'

type ECLevel = 'L' | 'M' | 'Q' | 'H'

interface VisualOpts {
  size: number
  ec: ECLevel
  fg: string
  bg: string
}

function escapeWifi(s: string): string {
  return s.replace(/([\\;,":])/g, '\\$1')
}

function buildWifiString(ssid: string, password: string, enc: string, hidden: boolean) {
  const t = enc === 'WPA' ? 'WPA' : enc === 'WEP' ? 'WEP' : 'nopass'
  return `WIFI:T:${t};S:${escapeWifi(ssid)};P:${escapeWifi(password)};${
    hidden ? 'H:true;' : ''
  };`
}

function buildVCard(data: {
  firstName: string
  lastName: string
  org: string
  title: string
  phone: string
  email: string
  url: string
}) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${data.lastName};${data.firstName}`,
    `FN:${data.firstName} ${data.lastName}`.trim(),
    data.org ? `ORG:${data.org}` : '',
    data.title ? `TITLE:${data.title}` : '',
    data.phone ? `TEL;TYPE=CELL:${data.phone}` : '',
    data.email ? `EMAIL:${data.email}` : '',
    data.url ? `URL:${data.url}` : '',
    'END:VCARD',
  ].filter(Boolean)
  return lines.join('\n')
}

export default function QrCodeGenerator() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = React.useState('')

  const [visual, setVisual] = React.useState<VisualOpts>({
    size: 256,
    ec: 'M',
    fg: '#000000',
    bg: '#FFFFFF',
  })

  // Inputs
  const [text, setText] = React.useState('https://example.com')
  const [url, setUrl] = React.useState('https://example.com')
  const [wifi, setWifi] = React.useState({
    ssid: 'MyNetwork',
    password: '',
    enc: 'WPA',
    hidden: false,
  })
  const [vcard, setVcard] = React.useState({
    firstName: 'Jane',
    lastName: 'Doe',
    org: '',
    title: '',
    phone: '',
    email: '',
    url: '',
  })
  const [mode, setMode] = React.useState<'text' | 'url' | 'wifi' | 'vcard'>(
    'text'
  )

  const content = React.useMemo(() => {
    if (mode === 'text') return text
    if (mode === 'url') return url
    if (mode === 'wifi') return buildWifiString(wifi.ssid, wifi.password, wifi.enc, wifi.hidden)
    return buildVCard(vcard)
  }, [mode, text, url, wifi, vcard])

  React.useEffect(() => {
    let cancelled = false
    if (!content) {
      setDataUrl('')
      return
    }
    QRCode.toDataURL(content, {
      errorCorrectionLevel: visual.ec,
      width: visual.size,
      margin: 2,
      color: {
        dark: visual.fg,
        light: visual.bg,
      },
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url)
          const cv = canvasRef.current
          if (cv) {
            const ctx = cv.getContext('2d')
            const img = new Image()
            img.onload = () => {
              ctx?.clearRect(0, 0, cv.width, cv.height)
              ctx?.drawImage(img, 0, 0, cv.width, cv.height)
            }
            img.src = url
          }
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to generate QR')
      })
    return () => {
      cancelled = true
    }
  }, [content, visual])

  const download = () => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'qrcode.png'
    a.click()
    toast.success('Downloaded QR code')
  }

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <QrCode className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Content</h2>
        </div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="mb-3 flex flex-wrap h-auto">
            <TabsTrigger value="text" className="gap-1.5">
              <Type className="h-4 w-4" /> Text
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-1.5">
              <LinkIcon className="h-4 w-4" /> URL
            </TabsTrigger>
            <TabsTrigger value="wifi" className="gap-1.5">
              <Wifi className="h-4 w-4" /> Wi-Fi
            </TabsTrigger>
            <TabsTrigger value="vcard" className="gap-1.5">
              <User className="h-4 w-4" /> vCard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Any text to encode…"
              className="min-h-[100px] resize-y font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="url">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="font-mono"
            />
          </TabsContent>

          <TabsContent value="wifi">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Network name (SSID)</FieldLabel>
                <Input
                  value={wifi.ssid}
                  onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Encryption</FieldLabel>
                <Select
                  value={wifi.enc}
                  onValueChange={(v) => setWifi({ ...wifi, enc: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WPA">WPA/WPA2</SelectItem>
                    <SelectItem value="WEP">WEP</SelectItem>
                    <SelectItem value="nopass">No password</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Password</FieldLabel>
                <Input
                  value={wifi.password}
                  onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                  placeholder="Wi-Fi password"
                  type="text"
                />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={wifi.hidden}
                  onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })}
                  className="h-4 w-4"
                />
                Hidden network
              </label>
            </div>
          </TabsContent>

          <TabsContent value="vcard">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>First name</FieldLabel>
                <Input
                  value={vcard.firstName}
                  onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Last name</FieldLabel>
                <Input
                  value={vcard.lastName}
                  onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Organization</FieldLabel>
                <Input
                  value={vcard.org}
                  onChange={(e) => setVcard({ ...vcard, org: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Title</FieldLabel>
                <Input
                  value={vcard.title}
                  onChange={(e) => setVcard({ ...vcard, title: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <Input
                  value={vcard.phone}
                  onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <Input
                  value={vcard.email}
                  onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Website</FieldLabel>
                <Input
                  value={vcard.url}
                  onChange={(e) => setVcard({ ...vcard, url: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <h2 className="text-base font-semibold mb-3">Visual options</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <FieldLabel className="mb-0">Size</FieldLabel>
              <span className="text-sm font-mono text-muted-foreground">
                {visual.size}px
              </span>
            </div>
            <Slider
              min={128}
              max={512}
              step={32}
              value={[visual.size]}
              onValueChange={(v) => setVisual({ ...visual, size: v[0] })}
            />
          </div>
          <div>
            <FieldLabel>Error correction</FieldLabel>
            <Select
              value={visual.ec}
              onValueChange={(v: ECLevel) => setVisual({ ...visual, ec: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">L — Low (7%)</SelectItem>
                <SelectItem value="M">M — Medium (15%)</SelectItem>
                <SelectItem value="Q">Q — Quartile (25%)</SelectItem>
                <SelectItem value="H">H — High (30%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Foreground</FieldLabel>
              <input
                type="color"
                value={visual.fg}
                onChange={(e) => setVisual({ ...visual, fg: e.target.value })}
                className="h-10 w-full rounded-md border border-input cursor-pointer bg-background"
                aria-label="Foreground color"
              />
            </div>
            <div>
              <FieldLabel>Background</FieldLabel>
              <input
                type="color"
                value={visual.bg}
                onChange={(e) => setVisual({ ...visual, bg: e.target.value })}
                className="h-10 w-full rounded-md border border-input cursor-pointer bg-background"
                aria-label="Background color"
              />
            </div>
          </div>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="flex justify-center sm:justify-start">
            <canvas
              ref={canvasRef}
              width={visual.size}
              height={visual.size}
              className="rounded-lg border border-border max-w-full h-auto"
              style={{ aspectRatio: '1 / 1' }}
            />
          </div>
          <div className="space-y-3 w-full sm:w-auto">
            <p className="text-sm text-muted-foreground">
              Scan with any phone camera or QR reader app.
            </p>
            <Button onClick={download} disabled={!dataUrl} className="gap-2 w-full">
              <Download className="h-4 w-4" /> Download PNG
            </Button>
            {dataUrl && (
              <p className="text-xs text-muted-foreground text-center">
                {visual.size} × {visual.size} px
              </p>
            )}
          </div>
        </div>
      </ToolCardWrapper>
    </div>
  )
}
