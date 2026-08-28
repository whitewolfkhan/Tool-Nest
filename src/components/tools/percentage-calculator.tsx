'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

function formatNumber(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—'
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

function ResultLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-lg bg-muted/50 p-4 text-center">
      <div className="text-3xl font-bold tabular-nums">{children}</div>
    </div>
  )
}

export default function PercentageCalculator() {
  // Mode A: X% of Y
  const [aPct, setAPct] = React.useState('')
  const [aNum, setANum] = React.useState('')
  const aResult =
    (parseFloat(aPct) || 0) * (parseFloat(aNum) || 0) / 100
  const aValid = aPct !== '' && aNum !== ''

  // Mode B: X is what % of Y
  const [bPart, setBPart] = React.useState('')
  const [bWhole, setBWhole] = React.useState('')
  const bResult = parseFloat(bWhole)
    ? ((parseFloat(bPart) || 0) / parseFloat(bWhole)) * 100
    : 0
  const bValid = bPart !== '' && bWhole !== ''

  // Mode C: % change from X to Y
  const [cFrom, setCFrom] = React.useState('')
  const [cTo, setCTo] = React.useState('')
  const from = parseFloat(cFrom)
  const to = parseFloat(cTo)
  const cResult = from && from !== 0 ? ((to - from) / Math.abs(from)) * 100 : 0
  const cValid = cFrom !== '' && cTo !== '' && from !== 0

  return (
    <ToolCardWrapper>
      <Tabs defaultValue="a">
        <TabsList className="w-full">
          <TabsTrigger value="a" className="flex-1">X% of Y</TabsTrigger>
          <TabsTrigger value="b" className="flex-1">X is what % of Y</TabsTrigger>
          <TabsTrigger value="c" className="flex-1">% Change</TabsTrigger>
        </TabsList>

        <TabsContent value="a" className="mt-4">
          <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <FieldLabel>Percentage (%)</FieldLabel>
              <Input
                type="number"
                value={aPct}
                onChange={(e) => setAPct(e.target.value)}
                placeholder="20"
              />
            </div>
            <div className="pb-2.5 text-muted-foreground text-center font-medium">of</div>
            <div>
              <FieldLabel>Value</FieldLabel>
              <Input
                type="number"
                value={aNum}
                onChange={(e) => setANum(e.target.value)}
                placeholder="150"
              />
            </div>
          </div>
          {aValid && (
            <ResultLine>
              {formatNumber(aResult)}
            </ResultLine>
          )}
        </TabsContent>

        <TabsContent value="b" className="mt-4">
          <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <FieldLabel>Part</FieldLabel>
              <Input
                type="number"
                value={bPart}
                onChange={(e) => setBPart(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="pb-2.5 text-muted-foreground text-center font-medium">of</div>
            <div>
              <FieldLabel>Whole</FieldLabel>
              <Input
                type="number"
                value={bWhole}
                onChange={(e) => setBWhole(e.target.value)}
                placeholder="150"
              />
            </div>
          </div>
          {bValid && (
            <ResultLine>
              {formatNumber(bResult)}%
            </ResultLine>
          )}
        </TabsContent>

        <TabsContent value="c" className="mt-4">
          <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <FieldLabel>From (original)</FieldLabel>
              <Input
                type="number"
                value={cFrom}
                onChange={(e) => setCFrom(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="pb-2.5 text-muted-foreground text-center font-medium">→</div>
            <div>
              <FieldLabel>To (new)</FieldLabel>
              <Input
                type="number"
                value={cTo}
                onChange={(e) => setCTo(e.target.value)}
                placeholder="125"
              />
            </div>
          </div>
          {cValid && (
            <ResultLine>
              {cResult > 0 ? '+' : ''}{formatNumber(cResult)}%
              <div className="text-sm font-medium text-muted-foreground mt-1">
                {cResult > 0 ? 'Increase' : cResult < 0 ? 'Decrease' : 'No change'}
              </div>
            </ResultLine>
          )}
        </TabsContent>
      </Tabs>
    </ToolCardWrapper>
  )
}
