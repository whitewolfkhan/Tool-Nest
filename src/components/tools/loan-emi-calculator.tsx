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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

function currency(n: number): string {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
}

interface ScheduleRow {
  month: number
  principal: number
  interest: number
  balance: number
}

export default function LoanEmiCalculator() {
  const [principal, setPrincipal] = React.useState('')
  const [rate, setRate] = React.useState('')
  const [tenureValue, setTenureValue] = React.useState('')
  const [tenureUnit, setTenureUnit] = React.useState<'years' | 'months'>('years')

  const P = parseFloat(principal) || 0
  const annualRate = parseFloat(rate) || 0
  const monthlyRate = annualRate / 12 / 100
  const n =
    tenureUnit === 'years'
      ? (parseInt(tenureValue) || 0) * 12
      : parseInt(tenureValue) || 0

  let emi = 0
  let totalPayment = 0
  let totalInterest = 0
  let schedule: ScheduleRow[] = []

  if (P > 0 && monthlyRate > 0 && n > 0) {
    emi =
      (P * monthlyRate * Math.pow(1 + monthlyRate, n)) /
      (Math.pow(1 + monthlyRate, n) - 1)
    totalPayment = emi * n
    totalInterest = totalPayment - P

    let balance = P
    for (let m = 1; m <= Math.min(12, n); m++) {
      const interest = balance * monthlyRate
      const principalPaid = emi - interest
      balance -= principalPaid
      schedule.push({
        month: m,
        principal: principalPaid,
        interest,
        balance: Math.max(0, balance),
      })
    }
  }

  const valid = emi > 0

  const pieData = [
    { name: 'Principal', value: P },
    { name: 'Interest', value: totalInterest },
  ]
  const PIE_COLORS = ['#10b981', '#f43f5e']

  return (
    <ToolCardWrapper>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Loan Amount ($)</FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="100000"
          />
        </div>
        <div>
          <FieldLabel>Annual Interest Rate (%)</FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="6.5"
          />
        </div>
        <div>
          <FieldLabel>Tenure</FieldLabel>
          <Input
            type="number"
            inputMode="numeric"
            value={tenureValue}
            onChange={(e) => setTenureValue(e.target.value)}
            placeholder="20"
          />
        </div>
        <div>
          <FieldLabel>Unit</FieldLabel>
          <Select
            value={tenureUnit}
            onValueChange={(v) => setTenureUnit(v as 'years' | 'months')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="years">Years</SelectItem>
              <SelectItem value="months">Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {valid && (
        <>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="text-center rounded-lg border border-border p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Monthly EMI</div>
              <div className="text-3xl font-bold mt-1">{currency(emi)}</div>
            </div>
            <div className="text-center rounded-lg border border-border p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Interest</div>
              <div className="text-3xl font-bold mt-1 text-rose-500">{currency(totalInterest)}</div>
            </div>
            <div className="text-center rounded-lg border border-border p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Payment</div>
              <div className="text-3xl font-bold mt-1">{currency(totalPayment)}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Principal vs Interest</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    cx="50%"
                    cy="50%"
                    label={(entry) => `${entry.name}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => currency(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Payment Breakdown by Year</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { name: 'Year 1', principal: schedule.reduce((s, r) => s + r.principal, 0), interest: schedule.reduce((s, r) => s + r.interest, 0) },
                    { name: 'Total', principal: P, interest: totalInterest },
                  ]}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => currency(Number(v))} />
                  <Bar dataKey="principal" stackId="a" fill="#10b981" name="Principal" />
                  <Bar dataKey="interest" stackId="a" fill="#f43f5e" name="Interest" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Amortization — First 12 Months</h4>
            <div className="rounded-lg border border-border max-h-72 overflow-auto scrollbar-thin">
              <Table className="min-w-max">
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((r) => (
                    <TableRow key={r.month}>
                      <TableCell>{r.month}</TableCell>
                      <TableCell className="tabular-nums">{currency(r.principal)}</TableCell>
                      <TableCell className="tabular-nums text-rose-500">{currency(r.interest)}</TableCell>
                      <TableCell className="tabular-nums">{currency(r.balance)}</TableCell>
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
