'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

type Unit = 'metric' | 'imperial'

interface BmiCategory {
  label: string
  color: string
  text: string
}

function getCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return { label: 'Underweight', color: 'bg-sky-100 text-sky-700', text: 'text-sky-500' }
  if (bmi < 25) return { label: 'Normal weight', color: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-500' }
  if (bmi < 30) return { label: 'Overweight', color: 'bg-amber-100 text-amber-700', text: 'text-amber-500' }
  return { label: 'Obese', color: 'bg-rose-100 text-rose-700', text: 'text-rose-500' }
}

export default function BmiCalculator() {
  const [unit, setUnit] = React.useState<Unit>('metric')
  const [weight, setWeight] = React.useState('')
  const [heightCm, setHeightCm] = React.useState('')
  const [feet, setFeet] = React.useState('')
  const [inches, setInches] = React.useState('')

  let bmi: number | null = null
  let heightM = 0

  if (unit === 'metric') {
    const w = parseFloat(weight)
    const h = parseFloat(heightCm)
    if (w > 0 && h > 0) {
      heightM = h / 100
      bmi = w / (heightM * heightM)
    }
  } else {
    const w = parseFloat(weight)
    const f = parseFloat(feet) || 0
    const i = parseFloat(inches) || 0
    const totalInches = f * 12 + i
    if (w > 0 && totalInches > 0) {
      bmi = (703 * w) / (totalInches * totalInches)
      heightM = totalInches * 0.0254
    }
  }

  // Healthy weight range (BMI 18.5–24.9) at this height
  let idealLowKg = 0
  let idealHighKg = 0
  if (heightM > 0) {
    idealLowKg = 18.5 * heightM * heightM
    idealHighKg = 24.9 * heightM * heightM
  }

  const cat = bmi ? getCategory(bmi) : null

  // Map BMI 15..40 → 0..100% for marker
  const markerPct = bmi
    ? Math.min(100, Math.max(0, ((bmi - 15) / (40 - 15)) * 100))
    : 0

  // Segment widths (in %)
  const segWidths = {
    under: ((18.5 - 15) / (40 - 15)) * 100,
    normal: ((24.9 - 18.5) / (40 - 15)) * 100,
    over: ((29.9 - 24.9) / (40 - 15)) * 100,
    obese: ((40 - 29.9) / (40 - 15)) * 100,
  }

  return (
    <ToolCardWrapper>
      <div className="flex justify-end mb-4">
        <Tabs value={unit} onValueChange={(v) => setUnit(v as Unit)}>
          <TabsList>
            <TabsTrigger value="metric">Metric (kg · cm)</TabsTrigger>
            <TabsTrigger value="imperial">Imperial (lb · ft)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Weight ({unit === 'metric' ? 'kg' : 'lb'})</FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={unit === 'metric' ? '70' : '154'}
          />
        </div>
        <div>
          {unit === 'metric' ? (
            <>
              <FieldLabel>Height (cm)</FieldLabel>
              <Input
                type="number"
                inputMode="decimal"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
              />
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel>Feet</FieldLabel>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={feet}
                  onChange={(e) => setFeet(e.target.value)}
                  placeholder="5"
                />
              </div>
              <div>
                <FieldLabel>Inches</FieldLabel>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={inches}
                  onChange={(e) => setInches(e.target.value)}
                  placeholder="9"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      <div className="mt-6 text-center">
        <div className="text-sm text-muted-foreground mb-1">Your BMI</div>
        {bmi ? (
          <div className="text-5xl font-bold tracking-tight">{bmi.toFixed(1)}</div>
        ) : (
          <div className="text-5xl font-bold tracking-tight text-muted-foreground">—</div>
        )}
        {cat && (
          <Badge variant="secondary" className={`mt-3 ${cat.color}`}>
            {cat.label}
          </Badge>
        )}
      </div>

      {/* Visual scale */}
      <div className="mt-6">
        <div className="relative">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div className="bg-sky-400" style={{ width: `${segWidths.under}%` }} />
            <div className="bg-emerald-400" style={{ width: `${segWidths.normal}%` }} />
            <div className="bg-amber-400" style={{ width: `${segWidths.over}%` }} />
            <div className="bg-rose-400" style={{ width: `${segWidths.obese}%` }} />
          </div>
          {bmi && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${markerPct}%` }}
            >
              <div className="h-5 w-1 rounded bg-foreground shadow-md" />
            </div>
          )}
        </div>
        <div className="relative mt-2 text-xs text-muted-foreground">
          <span className="absolute left-0">15</span>
          <span className="absolute" style={{ left: `${segWidths.under}%`, transform: 'translateX(-50%)' }}>18.5</span>
          <span className="absolute" style={{ left: `${segWidths.under + segWidths.normal}%`, transform: 'translateX(-50%)' }}>25</span>
          <span className="absolute" style={{ left: `${segWidths.under + segWidths.normal + segWidths.over}%`, transform: 'translateX(-50%)' }}>30</span>
          <span className="absolute right-0">40</span>
          <div className="h-4" />
        </div>
      </div>

      {idealLowKg > 0 && (
        <div className="mt-2 rounded-lg bg-muted/50 p-4 text-center text-sm">
          <span className="text-muted-foreground">Healthy weight range for your height: </span>
          <span className="font-semibold">
            {unit === 'metric'
              ? `${idealLowKg.toFixed(1)} – ${idealHighKg.toFixed(1)} kg`
              : `${(idealLowKg * 2.20462).toFixed(1)} – ${(idealHighKg * 2.20462).toFixed(1)} lb`}
          </span>
        </div>
      )}
    </ToolCardWrapper>
  )
}
