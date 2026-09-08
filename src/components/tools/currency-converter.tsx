'use client'

import * as React from 'react'
import { ArrowRight, ArrowLeftRight, Search, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  ToolCardWrapper,
  FieldLabel,
  CopyButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Comprehensive list of world currencies (ISO 4217)                  */
/* ------------------------------------------------------------------ */
interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  flag: string
}

const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'रू', flag: '🇳🇵' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼', flag: '🇴🇲' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', flag: '🇯🇴' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', flag: '🇱🇧' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', flag: '🇮🇷' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', flag: '🇮🇶' },
  { code: 'SYP', name: 'Syrian Pound', symbol: '£S', flag: '🇸🇾' },
  { code: 'YER', name: 'Yemeni Rial', symbol: '﷼', flag: '🇾🇪' },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', flag: '🇦🇫' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', flag: '🇭🇷' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин', flag: '🇷🇸' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr', flag: '🇮🇸' },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', flag: '🇲🇰' },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', flag: '🇦🇱' },
  { code: 'BAM', name: 'Bosnia Mark', symbol: 'KM', flag: '🇧🇦' },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', flag: '🇲🇩' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾', flag: '🇬🇪' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏', flag: '🇦🇲' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', flag: '🇦🇿' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', flag: '🇰🇿' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'soʻm', flag: '🇺🇿' },
  { code: 'KGS', name: 'Kyrgystani Som', symbol: 'с', flag: '🇰🇬' },
  { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'ЅМ', flag: '🇹🇯' },
  { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'm', flag: '🇹🇲' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', flag: '🇵🇪' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', flag: '🇺🇾' },
  { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲', flag: '🇵🇾' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs', flag: '🇧🇴' },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs', flag: '🇻🇪' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', flag: '🇬🇹' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', flag: '🇭🇳' },
  { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$', flag: '🇳🇮' },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', flag: '🇨🇷' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', flag: '🇵🇦' },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$', flag: '🇩🇴' },
  { code: 'CUP', name: 'Cuban Peso', symbol: '₱', flag: '🇨🇺' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', flag: '🇷🇼' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', flag: '🇪🇹' },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh', flag: '🇸🇴' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: '£', flag: '🇸🇩' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', flag: '🇸🇳' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', flag: '🇨🇲' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', flag: '🇲🇦' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'دج', flag: '🇩🇿' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', flag: '🇹🇳' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د', flag: '🇱🇾' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', flag: '🇦🇴' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', flag: '🇿🇲' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', flag: '🇧🇼' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', flag: '🇳🇦' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', flag: '🇲🇿' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', flag: '🇲🇺' },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨', flag: '🇸🇨' },
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D', flag: '🇬🇲' },
  { code: 'LRD', name: 'Liberian Dollar', symbol: '$', flag: '🇱🇷' },
  { code: 'SLR', name: 'Sierra Leonean Leone', symbol: 'Le', flag: '🇸🇱' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'KPW', name: 'North Korean Won', symbol: '₩', flag: '🇰🇵' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  { code: 'MMK', name: 'Burmese Kyat', symbol: 'K', flag: '🇲🇲' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', flag: '🇰🇭' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', flag: '🇱🇦' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', flag: '🇧🇳' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$', flag: '🇫🇯' },
  { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K', flag: '🇵🇬' },
  { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$', flag: '🇸🇧' },
  { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'Vt', flag: '🇻🇺' },
  { code: 'WST', name: 'Samoan Tala', symbol: 'WS$', flag: '🇼🇸' },
  { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$', flag: '🇹🇴' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'XPF', name: 'CFP Franc', symbol: '₣', flag: '🇳🇨' },
]

const CURRENCY_MAP: Record<string, CurrencyInfo> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c])
)

/* ------------------------------------------------------------------ */
/*  Live exchange rates via free open.er-api.com API (no key needed)  */
/* ------------------------------------------------------------------ */
interface RateResult {
  base: string
  rates: Record<string, number>
  lastUpdated: Date
}

const POPULAR_PAIRS = [
  ['USD', 'EUR'],
  ['USD', 'GBP'],
  ['USD', 'JPY'],
  ['USD', 'INR'],
  ['USD', 'CNY'],
  ['EUR', 'GBP'],
  ['USD', 'PKR'],
  ['USD', 'BDT'],
]

export default function CurrencyConverter() {
  const [amount, setAmount] = React.useState('100')
  const [from, setFrom] = React.useState('USD')
  const [to, setTo] = React.useState('EUR')
  const [rates, setRates] = React.useState<RateResult | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fromSearch, setFromSearch] = React.useState('')
  const [toSearch, setToSearch] = React.useState('')

  // Fetch rates whenever the `from` currency changes
  const fetchRates = React.useCallback(async (base: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`)
      if (!res.ok) throw new Error(`Failed to fetch rates (${res.status})`)
      const data = await res.json()
      if (data?.result !== 'success' || !data?.rates) {
        throw new Error(data?.error || 'Invalid API response')
      }
      setRates({
        base: data.base_code || base,
        rates: data.rates,
        lastUpdated: new Date(),
      })
    } catch (e) {
      setError((e as Error).message || 'Failed to load exchange rates')
      toast.error('Failed to load exchange rates. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRates(from)
  }, [from, fetchRates])

  const rate = rates?.rates?.[to]
  const amountNum = parseFloat(amount) || 0
  const converted = rate ? amountNum * rate : 0

  // Reverse conversion (1 `to` in `from`)
  const reverseRate = rate ? 1 / rate : 0

  function swap() {
    setFrom(to)
    setTo(from)
  }

  function quickConvert(target: string) {
    setTo(target)
  }

  const filteredFrom = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(fromSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(fromSearch.toLowerCase())
  )
  const filteredTo = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(toSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(toSearch.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Main converter */}
      <ToolCardWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          {/* From */}
          <div className="space-y-3">
            <FieldLabel>Amount</FieldLabel>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              min="0"
              className="text-lg h-12"
            />
            <FieldLabel>From</FieldLabel>
            <Select value={from} onValueChange={setFrom} onOpenChange={(open) => { if (!open) setFromSearch('') }}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 sticky top-0 bg-popover z-10">
                  <Input
                    placeholder="Search currency..."
                    value={fromSearch}
                    onChange={(e) => setFromSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus
                    className="h-9"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto scrollbar-thin">
                  {filteredFrom.length === 0 && (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                      No currencies found
                    </div>
                  )}
                  {filteredFrom.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="mr-2">{c.flag}</span>
                      <span className="font-medium">{c.code}</span>
                      <span className="ml-2 text-muted-foreground">{c.name}</span>
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Swap button */}
          <div className="flex justify-center pb-1">
            <Button
              variant="outline"
              size="icon"
              onClick={swap}
              className="h-12 w-12 rounded-full"
              aria-label="Swap currencies"
            >
              <ArrowLeftRight className="h-5 w-5" />
            </Button>
          </div>

          {/* To */}
          <div className="space-y-3">
            <FieldLabel>Converted amount</FieldLabel>
            <div className="h-12 flex items-center px-3 rounded-md border border-border bg-secondary/50">
              <span className="text-lg font-semibold">
                {loading ? (
                  <span className="text-muted-foreground">Loading…</span>
                ) : error ? (
                  <span className="text-destructive text-sm">Error</span>
                ) : (
                  converted.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                )}
              </span>
            </div>
            <FieldLabel>To</FieldLabel>
            <Select value={to} onValueChange={setTo} onOpenChange={(open) => { if (!open) setToSearch('') }}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 sticky top-0 bg-popover z-10">
                  <Input
                    placeholder="Search currency..."
                    value={toSearch}
                    onChange={(e) => setToSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus
                    className="h-9"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto scrollbar-thin">
                  {filteredTo.length === 0 && (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                      No currencies found
                    </div>
                  )}
                  {filteredTo.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="mr-2">{c.flag}</span>
                      <span className="font-medium">{c.code}</span>
                      <span className="ml-2 text-muted-foreground">{c.name}</span>
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Exchange rate display */}
        <Separator className="my-4" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {rate ? (
              <>
                <span className="font-medium text-foreground">1 {from}</span>
                {' = '}
                <span className="font-medium text-primary">{rate.toFixed(4)} {to}</span>
                <span className="mx-2">•</span>
                <span className="font-medium text-foreground">1 {to}</span>
                {' = '}
                <span className="font-medium text-primary">{reverseRate.toFixed(4)} {from}</span>
              </>
            ) : (
              'Exchange rate will appear here'
            )}
          </div>
          <div className="flex items-center gap-2">
            {rates && (
              <Badge variant="secondary" className="gap-1.5">
                <RefreshCw className="h-3 w-3" />
                {rates.lastUpdated.toLocaleTimeString()}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchRates(from)}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {converted > 0 && (
              <CopyButton
                text={converted.toFixed(2)}
                label="Copy result"
              />
            )}
          </div>
        </div>
        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}
      </ToolCardWrapper>

      {/* Popular conversions */}
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Popular conversions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {POPULAR_PAIRS.map(([f, t]) => {
            const r = rates?.base === f ? rates?.rates?.[t] : null
            return (
              <button
                key={`${f}-${t}`}
                onClick={() => {
                  setFrom(f)
                  setTo(t)
                }}
                className="flex flex-col items-start rounded-lg border border-border p-3 hover:border-primary/40 hover:bg-accent transition-colors text-left"
              >
                <span className="text-xs text-muted-foreground">{f} → {t}</span>
                <span className="text-sm font-semibold">
                  {r ? r.toFixed(2) : '—'}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Rates shown are 1 {from} → target currency. Click a pair to load it into the converter above.
        </p>
      </ToolCardWrapper>

      {/* Conversion table for the selected `from` currency */}
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            1 {from} ({CURRENCY_MAP[from]?.name}) converted to popular currencies
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {CURRENCIES.filter((c) => c.code !== from).slice(0, 20).map((c) => {
            const r = rates?.rates?.[c.code]
            const trend = r ? (r > 1 ? 'up' : 'down') : null
            return (
              <button
                key={c.code}
                onClick={() => quickConvert(c.code)}
                className="flex items-center justify-between rounded-lg border border-border p-2.5 hover:border-primary/40 hover:bg-accent transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{c.flag}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{c.code}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">
                    {r ? r.toFixed(2) : '—'}
                  </span>
                  {trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                  {trend === 'down' && <TrendingDown className="h-3 w-3 text-rose-500" />}
                </div>
              </button>
            )
          })}
        </div>
      </ToolCardWrapper>

      {/* Info */}
      <ToolCardWrapper>
        <h3 className="text-sm font-semibold mb-2">About this tool</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            This currency converter supports <strong className="text-foreground">{CURRENCIES.length} world currencies</strong> with live exchange rates.
            Rates are fetched from the free <code className="text-xs bg-muted px-1.5 py-0.5 rounded">open.er-api.com</code> API and update every time you change the source currency or click Refresh.
          </p>
          <p>
            <strong className="text-foreground">Disclaimer:</strong> Exchange rates are for informational purposes only and may differ from the rates offered by banks or financial institutions. Always verify with your provider before making any financial transaction.
          </p>
        </div>
      </ToolCardWrapper>
    </div>
  )
}
