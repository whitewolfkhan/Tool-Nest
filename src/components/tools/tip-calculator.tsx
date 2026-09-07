'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Users } from 'lucide-react'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

function money(n: number): string {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const QUICK_TIPS = [10, 15, 18, 20]

export default function TipCalculator() {
  const [bill, setBill] = React.useState('')
  const [tipPct, setTipPct] = React.useState(15)
  const [people, setPeople] = React.useState(1)

  const billNum = parseFloat(bill) || 0
  const tipAmount = (billNum * tipPct) / 100
  const total = billNum + tipAmount
  const perPerson = people > 0 ? total / people : 0
  const tipPerPerson = people > 0 ? tipAmount / people : 0

  const setPeopleSafe = (n: number) => setPeople(Math.max(1, Math.min(100, n)))

  return (
    <ToolCardWrapper>
      <div className="grid gap-5">
        <div>
          <FieldLabel>Bill Amount ($)</FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            value={bill}
            onChange={(e) => setBill(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <FieldLabel className="mb-0">Tip Percentage</FieldLabel>
            <span className="text-sm font-bold tabular-nums">{tipPct}%</span>
          </div>
          <Slider
            value={[tipPct]}
            onValueChange={(v) => setTipPct(v[0])}
            min={0}
            max={30}
            step={1}
            aria-label="Tip percentage"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_TIPS.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={tipPct === t ? 'default' : 'outline'}
                onClick={() => setTipPct(t)}
                className="min-w-[3.5rem]"
              >
                {t}%
              </Button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Number of People</FieldLabel>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPeopleSafe(people - 1)}
              disabled={people <= 1}
              aria-label="Remove person"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min={1}
              max={100}
              value={people}
              onChange={(e) => setPeopleSafe(parseInt(e.target.value) || 1)}
              className="text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPeopleSafe(people + 1)}
              disabled={people >= 100}
              aria-label="Add person"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {billNum > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tip Amount</span>
            <span className="font-semibold tabular-nums">{money(tipAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Bill</span>
            <span className="font-semibold tabular-nums">{money(total)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Tip / person
            </span>
            <span className="font-semibold tabular-nums">{money(tipPerPerson)}</span>
          </div>

          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4 mt-2 text-center">
            <div className="text-sm text-muted-foreground mb-1">
              Each person pays
            </div>
            <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {money(perPerson)}
            </div>
          </div>
        </div>
      )}
    </ToolCardWrapper>
  )
}
