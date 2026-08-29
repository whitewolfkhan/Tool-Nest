'use client'

import * as React from 'react'
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInYears,
  format,
} from 'date-fns'
import { Input } from '@/components/ui/input'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

interface AgeResult {
  years: number
  months: number
  days: number
  totalDays: number
  totalHours: number
  totalMinutes: number
  daysToBday: number
  nextBday: Date
}

function computeAge(birth: Date, target: Date): AgeResult {
  let years = target.getFullYear() - birth.getFullYear()
  let months = target.getMonth() - birth.getMonth()
  let days = target.getDate() - birth.getDate()

  if (days < 0) {
    months -= 1
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  let nextBday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate())
  if (nextBday <= target) {
    nextBday = new Date(target.getFullYear() + 1, birth.getMonth(), birth.getDate())
  }
  const daysToBday = differenceInDays(nextBday, target)

  return {
    years,
    months,
    days,
    totalDays: differenceInDays(target, birth),
    totalHours: differenceInHours(target, birth),
    totalMinutes: differenceInMinutes(target, birth),
    daysToBday,
    nextBday,
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

export default function AgeCalculator() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [dob, setDob] = React.useState('')
  const [ageAt, setAgeAt] = React.useState(today)

  const birthDate = dob ? new Date(dob + 'T00:00:00') : null
  const targetDate = ageAt ? new Date(ageAt + 'T00:00:00') : new Date()

  let result: AgeResult | null = null
  let error: string | null = null

  if (birthDate) {
    const now = new Date()
    if (birthDate > now) {
      error = 'Date of birth cannot be in the future'
    } else if (birthDate > targetDate) {
      error = 'Date of birth cannot be after the target date'
    } else {
      result = computeAge(birthDate, targetDate)
    }
  }

  // Surface errors via toast
  React.useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <ToolCardWrapper>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Date of Birth</FieldLabel>
          <Input
            type="date"
            value={dob}
            max={today}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Age At Date</FieldLabel>
          <Input
            type="date"
            value={ageAt}
            onChange={(e) => setAgeAt(e.target.value)}
          />
        </div>
      </div>

      {result && (
        <>
          <div className="mt-6 text-center">
            <div className="text-sm text-muted-foreground">Your age</div>
            <div className="text-4xl font-bold mt-2 leading-tight">
              <span className="tabular-nums">{result.years}</span>
              <span className="text-2xl text-muted-foreground font-medium"> yrs </span>
              <span className="tabular-nums">{result.months}</span>
              <span className="text-2xl text-muted-foreground font-medium"> mo </span>
              <span className="tabular-nums">{result.days}</span>
              <span className="text-2xl text-muted-foreground font-medium"> days</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            <Stat label="Total days" value={result.totalDays.toLocaleString()} />
            <Stat label="Total hours" value={result.totalHours.toLocaleString()} />
            <Stat label="Total minutes" value={result.totalMinutes.toLocaleString()} />
          </div>

          <div className="mt-4 rounded-lg bg-muted/50 p-4 text-center">
            <span className="text-sm text-muted-foreground">Next birthday in </span>
            <span className="font-bold text-lg tabular-nums">{result.daysToBday}</span>
            <span className="text-sm text-muted-foreground"> days</span>
            <div className="text-xs text-muted-foreground mt-1">
              ({format(result.nextBday, 'EEEE, MMM d, yyyy')})
            </div>
          </div>
        </>
      )}
    </ToolCardWrapper>
  )
}
