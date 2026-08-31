'use client'

import * as React from 'react'
import {
  Printer,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

interface LineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
}

const uid = () => Math.random().toString(36).slice(2, 9)

const CURRENCIES: Record<string, { symbol: string; label: string }> = {
  USD: { symbol: '$', label: 'US Dollar ($)' },
  EUR: { symbol: '€', label: 'Euro (€)' },
  GBP: { symbol: '£', label: 'Pound (£)' },
  JPY: { symbol: '¥', label: 'Yen (¥)' },
  INR: { symbol: '₹', label: 'Rupee (₹)' },
  CNY: { symbol: '¥', label: 'Yuan (¥)' },
  CAD: { symbol: 'C$', label: 'Canadian Dollar (C$)' },
  AUD: { symbol: 'A$', label: 'Australian Dollar (A$)' },
  BRL: { symbol: 'R$', label: 'Real (R$)' },
  CHF: { symbol: 'CHF', label: 'Swiss Franc (CHF)' },
  RUB: { symbol: '₽', label: 'Ruble (₽)' },
  KRW: { symbol: '₩', label: 'Won (₩)' },
}

function formatMoney(amount: number, symbol: string): string {
  const safe = isFinite(amount) ? amount : 0
  const fixed = safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${symbol}${fixed}`
}

export default function InvoiceGenerator() {
  const today = new Date().toISOString().slice(0, 10)
  const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)

  const [fromName, setFromName] = React.useState('Your Business LLC')
  const [fromAddress, setFromAddress] = React.useState('123 Main St\nCity, ST 12345')
  const [fromEmail, setFromEmail] = React.useState('you@example.com')

  const [toName, setToName] = React.useState('Client Name')
  const [toAddress, setToAddress] = React.useState('456 Client Ave\nCity, ST 67890')
  const [toEmail, setToEmail] = React.useState('client@example.com')

  const [invoiceNumber, setInvoiceNumber] = React.useState('INV-0001')
  const [date, setDate] = React.useState(today)
  const [due, setDue] = React.useState(dueDate)

  const [currency, setCurrency] = React.useState('USD')
  const [taxRate, setTaxRate] = React.useState(0)
  const [notes, setNotes] = React.useState('Thank you for your business!')

  const [items, setItems] = React.useState<LineItem[]>([
    { id: uid(), description: 'Web design service', qty: 1, unitPrice: 1200 },
    { id: uid(), description: 'Hosting (1 year)', qty: 1, unitPrice: 240 },
  ])

  const symbol = CURRENCIES[currency]?.symbol ?? '$'

  const subtotal = React.useMemo(
    () => items.reduce((sum, it) => sum + (it.qty || 0) * (it.unitPrice || 0), 0),
    [items]
  )
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const addItem = () => {
    setItems([...items, { id: uid(), description: '', qty: 1, unitPrice: 0 }])
  }
  const removeItem = (id: string) => {
    if (items.length <= 1) {
      toast.error('Keep at least one line item')
      return
    }
    setItems(items.filter((it) => it.id !== id))
  }
  const updateItem = (id: string, patch: Partial<LineItem>) => {
    setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  const printInvoice = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(invoiceNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1f2937;
    margin: 0;
    padding: 40px;
    background: #fff;
  }
  .invoice {
    max-width: 800px;
    margin: 0 auto;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;
    border-bottom: 2px solid #10b981;
    padding-bottom: 20px;
  }
  .brand { font-size: 28px; font-weight: 700; color: #10b981; }
  .invoice-title { font-size: 36px; font-weight: 300; color: #6b7280; }
  .meta { text-align: right; }
  .meta div { margin-bottom: 4px; font-size: 14px; }
  .parties { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 32px; }
  .party h4 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }
  .party p { margin: 0 0 2px 0; font-size: 14px; white-space: pre-line; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; }
  th.right, td.right { text-align: right; }
  td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
  .totals { margin-left: auto; width: 280px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .totals .total { font-weight: 700; font-size: 16px; border-top: 2px solid #1f2937; padding-top: 10px; margin-top: 6px; }
  .notes { margin-top: 32px; padding: 16px; background: #f9fafb; border-radius: 6px; font-size: 13px; color: #4b5563; }
  .notes h4 { margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #6b7280; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="brand">${escapeHtml(fromName || 'Your Business')}</div>
        <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;white-space:pre-line">${escapeHtml(fromAddress)}</p>
        <p style="margin:2px 0 0 0;font-size:13px;color:#6b7280">${escapeHtml(fromEmail)}</p>
      </div>
      <div class="meta">
        <div class="invoice-title">INVOICE</div>
        <div><strong>#${escapeHtml(invoiceNumber)}</strong></div>
        <div>Date: ${escapeHtml(date)}</div>
        <div>Due: ${escapeHtml(due)}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h4>Bill From</h4>
        <p><strong>${escapeHtml(fromName)}</strong></p>
        <p style="white-space:pre-line">${escapeHtml(fromAddress)}</p>
        <p>${escapeHtml(fromEmail)}</p>
      </div>
      <div class="party" style="text-align:right">
        <h4>Bill To</h4>
        <p><strong>${escapeHtml(toName)}</strong></p>
        <p style="white-space:pre-line">${escapeHtml(toAddress)}</p>
        <p>${escapeHtml(toEmail)}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Qty</th>
          <th class="right">Unit Price</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.filter((it) => it.description || it.qty > 0).map((it) => `
          <tr>
            <td>${escapeHtml(it.description || '—')}</td>
            <td class="right">${it.qty}</td>
            <td class="right">${formatMoney(it.unitPrice, symbol)}</td>
            <td class="right">${formatMoney((it.qty || 0) * (it.unitPrice || 0), symbol)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${formatMoney(subtotal, symbol)}</span></div>
      <div class="row"><span>Tax (${taxRate}%)</span><span>${formatMoney(taxAmount, symbol)}</span></div>
      <div class="row total"><span>Total</span><span>${formatMoney(total, symbol)}</span></div>
    </div>

    ${notes ? `
    <div class="notes">
      <h4>Notes</h4>
      <p style="margin:0;white-space:pre-line">${escapeHtml(notes)}</p>
    </div>` : ''}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`

    const w = window.open('', '_blank', 'width=900,height=900')
    if (!w) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.')
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
    toast.success('Invoice opened in new tab — use Ctrl/Cmd+P or the print dialog to save as PDF')
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* From */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Bill From</h3>
            <div>
              <FieldLabel>Your name / business</FieldLabel>
              <Input value={fromName} onChange={(e) => setFromName(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Address</FieldLabel>
              <Textarea value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} rows={3} />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
            </div>
          </div>

          {/* To */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Bill To</h3>
            <div>
              <FieldLabel>Client name</FieldLabel>
              <Input value={toName} onChange={(e) => setToName(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Address</FieldLabel>
              <Textarea value={toAddress} onChange={(e) => setToAddress(e.target.value)} rows={3} />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel>Invoice #</FieldLabel>
            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Date</FieldLabel>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Due date</FieldLabel>
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel>Currency</FieldLabel>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURRENCIES).map(([code, c]) => (
                  <SelectItem key={code} value={code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Tax rate (%)</FieldLabel>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={printInvoice} className="gap-1.5 w-full">
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Line items */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              Line items
            </h3>
            <Button onClick={addItem} variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add item
            </Button>
          </div>
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-32">Unit Price</TableHead>
                  <TableHead className="w-32 text-right">Amount</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <Input
                        value={it.description}
                        onChange={(e) => updateItem(it.id, { description: e.target.value })}
                        placeholder="Service or product"
                        className="border-0 px-1 h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={it.qty}
                        onChange={(e) => updateItem(it.id, { qty: parseFloat(e.target.value) || 0 })}
                        className="border-0 px-1 h-8 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={it.unitPrice}
                        onChange={(e) => updateItem(it.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        className="border-0 px-1 h-8 text-right font-mono"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatMoney((it.qty || 0) * (it.unitPrice || 0), symbol)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(it.id)}
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col items-end gap-1 text-sm">
            <div className="flex w-64 justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono">{formatMoney(subtotal, symbol)}</span>
            </div>
            <div className="flex w-64 justify-between text-muted-foreground">
              <span>Tax ({taxRate}%)</span>
              <span className="font-mono">{formatMoney(taxAmount, symbol)}</span>
            </div>
            <div className="flex w-64 justify-between font-semibold text-base border-t border-border pt-1">
              <span>Total</span>
              <span className="font-mono">{formatMoney(total, symbol)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <FieldLabel>Notes</FieldLabel>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Payment terms, thank-you note, etc."
          />
        </div>
      </ToolCardWrapper>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">How PDF download works</p>
        <p>
          When you click <strong>Print / Save PDF</strong>, the invoice opens in a new browser tab
          and your system print dialog opens. Choose <em>“Save as PDF”</em> as the destination to
          download a PDF. The invoice is styled to print on a single A4 / Letter page. All
          generation happens in your browser — your data is never uploaded.
        </p>
      </div>
    </div>
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
