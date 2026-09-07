'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

const FREQ: Record<string, number> = {
  annually: 1,
  semi: 2,
  quarterly: 4,
  monthly: 12,
  daily: 365,
}

function currency(n: number): string {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
}

export default function CompoundInterestCalculator() {
  const [principal, setPrincipal] = React.useState('')
  const [rate, setRate] = React.useState('')
  const [years, setYears] = React.useState('')
  const [freq, setFreq] = React.useState('monthly')

  const P = parseFloat(principal) || 0
  const r = (parseFloat(rate) || 0) / 100
  const t = parseInt(years) || 0
  const n = FREQ[freq] ?? 12

  const finalAmount = P > 0 && t > 0 && r >= 0 ? P * Math.pow(1 + r / n, n * t) : 0
  const interestEarned = finalAmount - P
  const valid = finalAmount > 0

  const yearlyData = React.useMemo(() => {
    if (!(P > 0) || !(t > 0)) return []
    const arr: { year: number; balance: number; interest: number }[] = []
    const limit = Math.min(10, t)
    for (let y = 1; y <= limit; y++) {
      const balance = P * Math.pow(1 + r / n, n * y)
      arr.push({ year: y, balance, interest: balance - P })
    }
    return arr
  }, [P, r, n, t])

  return (
    <ToolCardWrapper>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Principal Amount ($)</FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="10000"
          />
        </div>
        <div>
          <FieldLabel>Annual Interest Rate (%)</FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="7"
          />
        </div>
        <div>
          <FieldLabel>Time (years)</FieldLabel>
          <Input
            type="number"
            inputMode="numeric"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            placeholder="10"
          />
        </div>
        <div>
          <FieldLabel>Compounding Frequency</FieldLabel>
          <Select value={freq} onValueChange={setFreq}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annually">Annually</SelectItem>
              <SelectItem value="semi">Semi-annually</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {valid && (
        <>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="text-center rounded-lg border border-border p-4 sm:col-span-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Final Amount</div>
              <div className="text-2xl font-bold mt-1">{currency(finalAmount)}</div>
            </div>
            <div className="text-center rounded-lg border border-border p-4 sm:col-span-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Interest Earned</div>
              <div className="text-2xl font-bold mt-1 text-emerald-500">{currency(interestEarned)}</div>
            </div>
            <div className="text-center rounded-lg border border-border p-4 sm:col-span-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Return</div>
              <div className="text-2xl font-bold mt-1">
                {((finalAmount / P - 1) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Growth Over Time</h4>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => currency(Number(v))} labelFormatter={(v) => `Year ${v}`} />
                <Line type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Balance" />
                <Line type="monotone" dataKey="interest" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Interest" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Year-by-Year Breakdown</h4>
            <div className="rounded-lg border border-border max-h-72 overflow-auto scrollbar-thin">
              <Table className="min-w-max">
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Interest Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearlyData.map((r) => (
                    <TableRow key={r.year}>
                      <TableCell>{r.year}</TableCell>
                      <TableCell className="tabular-nums">{currency(r.balance)}</TableCell>
                      <TableCell className="tabular-nums text-emerald-500">{currency(r.interest)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </ToolCardWrapper>
  )
}
