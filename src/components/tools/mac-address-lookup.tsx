'use client'

import * as React from 'react'
import { Network, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

// Built-in OUI list (first 3 octets → vendor). Curated subset.
const OUI_DB: Record<string, string> = {
  '00:1A:11': 'Google, Inc.',
  '00:1B:44': 'Apple, Inc.',
  '00:03:93': 'Apple Computer, Inc.',
  '00:05:02': 'Apple Computer, Inc.',
  'AC:DE:48': 'Apple, Inc.',
  '3C:15:C2': 'Apple, Inc.',
  '00:25:9C': 'Cisco-Linksys, LLC',
  '00:1F:F3': 'Cisco Systems, Inc',
  '00:1B:54': 'Cisco Systems',
  '00:50:56': 'VMware, Inc.',
  '00:0C:29': 'VMware, Inc.',
  '00:50:C2': 'IEEE Registration Authority',
  '00:1D:09': 'Cisco Systems',
  '00:14:2D': 'Cisco Systems',
  'F0:18:98': 'Cisco Systems',
  '00:1F:33': 'Dell Inc.',
  '00:13:72': 'Dell Inc.',
  '00:11:43': 'Dell Inc.',
  '00:1E:C9': 'Dell Inc.',
  '00:1E:4F': 'Dell Inc.',
  '00:13:02': 'Dell PCBA Test',
  '00:14:22': 'Dell Inc.',
  '00:15:C5': 'Dell Inc.',
  '00:30:18': 'Microsoft Corporation',
  '00:50:F2': 'Microsoft Corporation',
  '00:17:FA': 'Microsoft Corporation',
  '00:25:AE': 'Microsoft Corporation',
  '00:1D:D8': 'Microsoft Corporation',
  '00:23:14': 'Microsoft Research',
  'B8:27:EB': 'Raspberry Pi Foundation',
  'DC:A6:32': 'Raspberry Pi Trading Ltd',
  'E4:5F:01': 'Raspberry Pi Trading Ltd',
  'D8:3A:DD': 'Raspberry Pi Trading Ltd',
  '00:1D:0F': 'Samsung Electronics Co.,Ltd',
  '00:15:99': 'Samsung Electronics Co.,Ltd',
  '00:12:FB': 'Samsung Electronics Co.,Ltd',
  '00:09:18': 'Cisco-Linksys, LLC',
  '00:14:6C': 'Netgear',
  '00:24:B2': 'Intel Corporate',
  '00:13:E8': 'Intel Corporate',
  '00:15:00': 'Intel Corporate',
  '00:0E:35': 'Intel Corporate',
  '00:0C:F1': 'Intel Corporate',
  '00:1C:42': 'Parallels, Inc.',
  '00:1C:B3': 'Cisco Systems',
  '00:24:E4': 'Cisco Systems',
  '00:1B:21': 'Intel Corporate',
  '00:14:78': 'Belkin International Inc.',
  '00:11:50': 'Belkin International Inc.',
  '00:30:BD': 'Belkin Components',
  '00:17:3F': 'Belkin International Inc.',
  '00:1A:70': 'Linksys',
  '00:1D:7E': 'Linksys',
  '00:14:2B': 'Netgear',
  '00:09:5B': 'Netgear',
  '00:1B:2F': 'Netgear',
  '00:0F:B0': 'Netgear',
  '00:1C:7E': 'D-Link International',
  '00:13:46': 'D-Link Corporation',
  '00:15:E9': 'D-Link Corporation',
  '00:0F:3D': 'D-Link Corporation',
  '00:1E:58': 'D-Link Corporation',
  '00:80:C8': 'D-Link Corporation',
}

interface LookupResult {
  normalized: string
  oui: string | null
  vendor: string | null
  isLocal: boolean
  isMulticast: boolean
  isValid: boolean
}

function normalizeMac(input: string): string {
  const hex = input.replace(/[^0-9A-Fa-f]/g, '').toUpperCase()
  if (hex.length < 6) return hex
  const octets: string[] = []
  for (let i = 0; i < Math.min(hex.length, 12); i += 2) {
    octets.push(hex.slice(i, i + 2))
  }
  return octets.join(':')
}

function lookup(input: string): LookupResult {
  const hex = input.replace(/[^0-9A-Fa-f]/g, '').toUpperCase()
  if (hex.length < 6) {
    return {
      normalized: hex,
      oui: null,
      vendor: null,
      isLocal: false,
      isMulticast: false,
      isValid: false,
    }
  }
  const normalized = normalizeMac(input)
  const firstOctet = parseInt(hex.slice(0, 2), 16)
  const isLocal = (firstOctet & 0b10) !== 0 // U/L bit
  const isMulticast = (firstOctet & 0b01) !== 0 // I/G bit
  const oui = hex.slice(0, 6).match(/.{2}/g)?.join(':') ?? null

  let vendor: string | null = null
  if (oui && !isLocal) {
    vendor = OUI_DB[oui] || null
  }

  return {
    normalized,
    oui,
    vendor,
    isLocal,
    isMulticast,
    isValid: hex.length === 12,
  }
}

export default function MacAddressLookup() {
  const [input, setInput] = React.useState('00:1A:11:00:00:00')
  const result = React.useMemo(() => lookup(input), [input])

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-2">
          <Network className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">MAC Address Lookup</h2>
        </div>
        <FieldLabel>Enter MAC address (any format)</FieldLabel>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="00:1A:11:00:00:00 or 00-1A-11-000000 or 001A11000000"
          className="font-mono text-base h-12"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Looks up the vendor by the first 3 octets (OUI). The lookup uses an
          embedded list of common vendors.
        </p>
      </ToolCardWrapper>

      {result.normalized.length >= 6 && (
        <ToolCardWrapper>
          <div className="grid sm:grid-cols-2 gap-4">
            <ResultRow label="Formatted MAC">
              <span className="font-mono font-semibold text-base">
                {result.normalized}
                {result.normalized.length < 17 && (
                  <span className="text-muted-foreground">
                    {':XX'.repeat(6 - result.normalized.split(':').length)}
                  </span>
                )}
              </span>
            </ResultRow>

            <ResultRow label="OUI">
              <span className="font-mono">
                {result.oui || '—'}
              </span>
            </ResultRow>

            <ResultRow label="Vendor">
              {result.isLocal ? (
                <Badge className="bg-amber-500">
                  Locally administered — no vendor OUI
                </Badge>
              ) : result.vendor ? (
                <Badge className="bg-emerald-600">{result.vendor}</Badge>
              ) : (
                <Badge variant="secondary">Unknown vendor</Badge>
              )}
            </ResultRow>

            <ResultRow label="Address type">
              {result.isMulticast ? (
                <Badge variant="destructive">Multicast</Badge>
              ) : (
                <Badge variant="secondary">Unicast</Badge>
              )}
              <span className="ml-2 text-xs text-muted-foreground">
                {result.isLocal ? 'Locally administered' : 'Globally unique (UAA)'}
              </span>
            </ResultRow>
          </div>

          {!result.vendor && !result.isLocal && (
            <div className="mt-4 rounded-lg border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-2">
              <Search className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This OUI is not in our embedded database. Only ~70 common
                vendors are included. For a full lookup, consult the IEEE OUI
                registry.
              </p>
            </div>
          )}

          {result.isLocal && (
            <div className="mt-4 rounded-lg border border-blue-300 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                This address has the locally-administered bit set, which means
                it was assigned locally (e.g. by a virtual machine or
                container). It does not have an IEEE-assigned vendor.
              </p>
            </div>
          )}
        </ToolCardWrapper>
      )}

      <ToolCardWrapper>
        <FieldLabel>Quick examples (click to load)</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {[
            '00:1A:11:00:00:00',
            '00:1B:44:11:22:33',
            'B8:27:EB:11:22:33',
            '00:50:56:00:00:00',
            '00:1D:09:11:22:33',
          ].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setInput(ex)}
              className="font-mono text-xs rounded-md border border-border px-2.5 py-1 hover:bg-accent transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </ToolCardWrapper>
    </div>
  )
}

function ResultRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center flex-wrap gap-2">{children}</div>
    </div>
  )
}
