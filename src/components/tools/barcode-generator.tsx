'use client'

import * as React from 'react'
import { Barcode, Download, Eraser } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import {
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'

// CODE128 B patterns table — each entry is 6 digits representing 3 bar/space pairs (11 modules total).
// Entry 104 = Start Code B. Entry 106 = Stop pattern (13 modules).
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213',
  '122312', '132212', '221213', '221312', '231212', '112232', '122132',
  '122231', '113222', '123122', '123221', '223211', '221132', '221231',
  '213212', '223112', '312131', '311222', '321122', '321221', '312212',
  '322112', '322211', '212123', '212321', '232121', '111323', '131123',
  '131321', '112313', '132113', '132311', '211313', '231113', '231311',
  '112133', '112331', '132131', '113123', '113321', '133121', '313121',
  '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111',
  '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114',
  '413111', '241112', '134111', '111242', '121142', '121241', '114212',
  '124112', '124211', '411212', '421112', '421211', '212141', '214121',
  '412121', '111143', '111341', '131141', '114113', '114311', '411113',
  '411311', '113141', '114131', '311141', '411131',
  '211412', // 103: Start A
  '211214', // 104: Start B
  '211232', // 105: Start C
  '2331112', // 106: Stop (13 modules)
]

const START_B = 104
const STOP = 106

function charToCodeB(ch: string): number {
  // Code B: ASCII 32..127 maps to value 0..95
  const code = ch.charCodeAt(0)
  if (code < 32 || code > 127) return -1
  return code - 32
}

function buildBarcode(text: string): {
  modules: number[]
  checkChar: number
  valid: boolean
  invalidChars: string[]
} {
  if (!text) return { modules: [], checkChar: 0, valid: false, invalidChars: [] }
  const invalidChars: string[] = []
  const values: number[] = [START_B]
  for (const ch of text) {
    const v = charToCodeB(ch)
    if (v < 0) {
      invalidChars.push(ch)
      continue
    }
    values.push(v)
  }
  // checksum
  let checksum = values[0]
  for (let i = 1; i < values.length; i++) {
    checksum += values[i] * i
  }
  const checkChar = checksum % 103
  values.push(checkChar)
  values.push(STOP)

  // expand to modules
  const modules: number[] = []
  for (const v of values) {
    const pattern = CODE128_PATTERNS[v]
    for (const c of pattern) modules.push(Number(c))
  }
  return { modules, checkChar, valid: true, invalidChars }
}

export default function BarcodeGenerator() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [text, setText] = React.useState('HELLO-12345')
  const [barHeight, setBarHeight] = React.useState(80)
  const [scale, setScale] = React.useState(2) // pixels per module

  const { modules, checkChar, valid, invalidChars } = React.useMemo(
    () => buildBarcode(text),
    [text]
  )

  React.useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const moduleCount = modules.length
    if (moduleCount === 0) {
      cv.width = 1
      cv.height = 1
      ctx.clearRect(0, 0, 1, 1)
      return
    }
    const quietZone = 10 * scale
    cv.width = moduleCount * scale + quietZone * 2
    cv.height = barHeight + 30
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, cv.width, cv.height)

    let x = quietZone
    for (let i = 0; i < modules.length; i++) {
      const w = modules[i] * scale
      // even indexes (0,2,4,...) are bars, odd are spaces
      if (i % 2 === 0) {
        ctx.fillStyle = '#000000'
        ctx.fillRect(x, 0, w, barHeight)
      }
      x += w
    }
    // human-readable text
    ctx.fillStyle = '#000000'
    ctx.font = `${Math.max(12, scale * 6)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      text,
      cv.width / 2,
      barHeight + 15
    )
  }, [modules, barHeight, scale, text])

  const download = () => {
    const cv = canvasRef.current
    if (!cv || !valid) {
      toast.error('Nothing to download')
      return
    }
    cv.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'barcode.png'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Downloaded barcode')
    }, 'image/png')
  }

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Barcode className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">CODE128B Barcode</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={!text}
            onClick={() => setText('')}
            className="gap-1.5"
          >
            <Eraser className="h-4 w-4" /> Clear
          </Button>
        </div>
        <FieldLabel>Text to encode</FieldLabel>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. ABC-1234"
          className="font-mono text-base"
          maxLength={48}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">
            {modules.length} modules
          </Badge>
          {valid && (
            <Badge variant="outline" className="font-mono">
              checksum: {checkChar}
            </Badge>
          )}
          {invalidChars.length > 0 && (
            <Badge variant="destructive">
              Skipped {invalidChars.length} unsupported char(s)
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          CODE128 B supports ASCII characters 32–126 (printable text). Non-ASCII
          characters are silently skipped.
        </p>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel className="mb-0">Bar height</FieldLabel>
              <span className="text-sm font-mono text-muted-foreground">
                {barHeight}px
              </span>
            </div>
            <Slider
              min={40}
              max={200}
              step={5}
              value={[barHeight]}
              onValueChange={(v) => setBarHeight(v[0])}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel className="mb-0">Module width</FieldLabel>
              <span className="text-sm font-mono text-muted-foreground">
                {scale}px
              </span>
            </div>
            <Slider
              min={1}
              max={6}
              step={1}
              value={[scale]}
              onValueChange={(v) => setScale(v[0])}
            />
          </div>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex justify-center mb-4 overflow-x-auto">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
        <div className="flex justify-center">
          <Button onClick={download} disabled={!valid} className="gap-2">
            <Download className="h-4 w-4" /> Download PNG
          </Button>
        </div>
      </ToolCardWrapper>
    </div>
  )
}
