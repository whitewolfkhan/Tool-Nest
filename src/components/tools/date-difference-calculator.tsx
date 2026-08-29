'use client'

import * as React from 'react'
import {
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  format,
} from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeftRight } from 'lucide-react'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

interface DiffResult {
  years: number
  months: number
  days: number
  totalDays: number
  totalWeeks: number
  totalMonths: number
  totalYears: number
  summary: string
}

function computeDiff(a: Date, b: Date): DiffResult {
  const start = a < b ? a : b
  const end = a < b ? b : a

  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  let days = end.getDate() - start.getDate()

  if (days < 0) {
    months -= 1
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const parts: string[] = []
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`)
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`)
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
  const summary = parts.length ? parts.join(', ') : 'Same day'

  return {
    years,
    months,
    days,
    totalDays: differenceInDays(end, start),
    totalWeeks: differenceInWeeks(end, start),
    totalMonths: differenceInMonths(end, start),
    totalYears: differenceInYears(end, start),
    summary,
  }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <div className="text-xl font-bold tabular-nums">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

export default function DateDifferenceCalculator() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [from, setFrom] = React.useState('')
  const [to, setTo] = React.useState(today)

  const fromDate = from ? new Date(from + 'T00:00:00') : null
  const toDate = to ? new Date(to + 'T00:00:00') : null

  const result =
    fromDate && toDate && fromDate.getTime() !== toDate.getTime()
      ? computeDiff(fromDate, toDate)
      : null

  return (
    <ToolCardWrapper>
      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <div>
          <FieldLabel>From Date</FieldLabel>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="mb-0.5"
          onClick={() => {
            const tmp = from
            setFrom(to)
            setTo(tmp)
          }}
          disabled={!from || !to}
          aria-label="Swap dates"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
        <div>
          <FieldLabel>To Date</FieldLabel>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {result && (
        <>
          <div className="mt-6 text-center">
            <div className="text-sm text-muted-foreground mb-1">Time between</div>
            <div className="text-3xl sm:text-4xl font-bold px-4">
              {result.summary}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <Stat label="Total days" value={result.totalDays} />
            <Stat label="Total weeks" value={result.totalWeeks} />
            <Stat label="Total months" value={result.totalMonths} />
            <Stat label="Total years" value={result.totalYears} />
          </div>

          <div className="mt-4 grid sm:grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-lg font-bold tabular-nums">{result.years}</div>
              <div className="text-xs text-muted-foreground">Years</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-lg font-bold tabular-nums">{result.months}</div>
              <div className="text-xs text-muted-foreground">Months</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-lg font-bold tabular-nums">{result.days}</div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>
          </div>
        </>
      )}
    </ToolCardWrapper>
  )
}
