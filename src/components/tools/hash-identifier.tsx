'use client'

import * as React from 'react'
import {
  Hash,
  Copy,
  Search,
  Shield,
  Database,
  Key,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

// Charset detection helpers
const HEX_RE = /^[0-9a-fA-F]+$/
const BASE64_STD_RE = /^[A-Za-z0-9+/=]+$/
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/

type Charset = 'hex' | 'base64' | 'base64url' | 'crypt' | 'other'

interface HashCandidate {
  name: string
  length: number
  charset: Charset[]
  uses: string
  notes?: string
}

// Master DB of well-known hash types keyed by length & charset.
// Length here is in *hex characters* (the canonical encoded form).
const HASH_DB: HashCandidate[] = [
  // 8 hex chars
  { name: 'CRC32', length: 8, charset: ['hex'], uses: 'File integrity checksums, ZIP entries', notes: 'Very fast, not cryptographic' },
  { name: 'Adler-32', length: 8, charset: ['hex'], uses: 'zlib checksums', notes: 'Not cryptographic' },
  // 16 hex chars
  { name: 'MySQL 3.x', length: 16, charset: ['hex'], uses: 'Legacy MySQL password hash (3.x)', notes: 'Cryptographically weak' },
  { name: 'MySQL 4.x / 5.x (old)', length: 16, charset: ['hex'], uses: 'Legacy MySQL password hash', notes: 'Replaced by SHA-1 based scheme' },
  { name: 'CRC64', length: 16, charset: ['hex'], uses: 'Checksums (e.g. XZ archives)' },
  { name: 'Lotus Domino / Cisco PIX', length: 16, charset: ['hex'], uses: 'Legacy proprietary password hashes' },
  // 32 hex chars
  { name: 'MD5', length: 32, charset: ['hex'], uses: 'File checksums, legacy password hashes (phpBB, WordPress <2.6)', notes: 'Broken — do not use for security' },
  { name: 'MD4', length: 32, charset: ['hex'], uses: 'NTLM password hashes, legacy protocols' },
  { name: 'NTLM (NT hash)', length: 32, charset: ['hex'], uses: 'Windows password storage', notes: 'MD4 of UTF-16LE password' },
  { name: 'RIPEMD-128', length: 32, charset: ['hex'], uses: 'Cryptographic digest (legacy)' },
  { name: 'Haval-128', length: 32, charset: ['hex'], uses: 'Cryptographic digest (legacy)' },
  { name: 'Tiger-128', length: 32, charset: ['hex'], uses: 'Tiger hash (truncated)' },
  { name: 'Snefru-128', length: 32, charset: ['hex'], uses: 'Cryptographic digest (rare)' },
  // 40 hex chars
  { name: 'SHA-1', length: 40, charset: ['hex'], uses: 'Git object IDs, TLS certs (deprecated), MySQL 4.1+ passwords', notes: 'Broken for collision resistance' },
  { name: 'RIPEMD-160', length: 40, charset: ['hex'], uses: 'Bitcoin addresses (P2PKH), OpenPGP' },
  { name: 'Tiger-160', length: 40, charset: ['hex'], uses: 'Tiger hash (truncated/extended)' },
  { name: 'Haval-160', length: 40, charset: ['hex'], uses: 'Cryptographic digest (legacy)' },
  { name: 'MySQL 4.x / 5.x', length: 40, charset: ['hex'], uses: 'MySQL password hash (SHA-1 based)', notes: 'SHA-1(SHA-1(password))' },
  // 48 hex chars
  { name: 'Tiger-192', length: 48, charset: ['hex'], uses: 'Tiger hash (full)' },
  { name: 'Haval-192', length: 48, charset: ['hex'], uses: 'Cryptographic digest (legacy)' },
  // 56 hex chars
  { name: 'SHA-224', length: 56, charset: ['hex'], uses: 'SHA-2 family (truncated 256)' },
  { name: 'SHA-3-224', length: 56, charset: ['hex'], uses: 'Keccak SHA-3 family' },
  { name: 'Haval-224', length: 56, charset: ['hex'], uses: 'Cryptographic digest (legacy)' },
  // 64 hex chars
  { name: 'SHA-256', length: 64, charset: ['hex'], uses: 'Bitcoin block hashes, TLS, file checksums, modern password hashing' },
  { name: 'SHA-3-256', length: 64, charset: ['hex'], uses: 'Keccak SHA-3 family' },
  { name: 'RIPEMD-256', length: 64, charset: ['hex'], uses: 'Cryptographic digest' },
  { name: 'Snefru-256', length: 64, charset: ['hex'], uses: 'Cryptographic digest' },
  { name: 'GOST (CryptoPro)', length: 64, charset: ['hex'], uses: 'Russian federal standard GOST R 34.11-94' },
  { name: 'Haval-256', length: 64, charset: ['hex'], uses: 'Cryptographic digest (legacy)' },
  // 80 hex chars
  { name: 'RIPEMD-320', length: 80, charset: ['hex'], uses: 'Extended RIPEMD (rare)' },
  // 96 hex chars
  { name: 'SHA-384', length: 96, charset: ['hex'], uses: 'SHA-2 family (truncated 512)' },
  { name: 'SHA-3-384', length: 96, charset: ['hex'], uses: 'Keccak SHA-3 family' },
  // 128 hex chars
  { name: 'SHA-512', length: 128, charset: ['hex'], uses: 'Modern cryptographic digest, file checksums' },
  { name: 'SHA-3-512', length: 128, charset: ['hex'], uses: 'Keccak SHA-3 family' },
  { name: 'Whirlpool', length: 128, charset: ['hex'], uses: 'Cryptographic digest (NESSIE)' },
  // Base64 (common lengths)
  { name: 'MD5 (base64)', length: 24, charset: ['base64'], uses: 'MD5 digest encoded as base64', notes: 'Same algorithm as MD5' },
  { name: 'SHA-1 (base64)', length: 28, charset: ['base64'], uses: 'SHA-1 digest encoded as base64' },
  { name: 'SHA-256 (base64)', length: 44, charset: ['base64'], uses: 'SHA-256 digest encoded as base64' },
  { name: 'SHA-512 (base64)', length: 88, charset: ['base64'], uses: 'SHA-512 digest encoded as base64' },
  { name: 'Bcrypt (base64)', length: 53, charset: ['base64'], uses: 'Bcrypt password hash body', notes: 'See crypt-prefix variants below' },
  // Crypt-prefixed password hashes
  { name: 'MD5 crypt ($1$)', length: -1, charset: ['crypt'], uses: 'Linux/Unix password hash (crypt(3) with $1$ prefix)', notes: 'Legacy, modern systems prefer $6$' },
  { name: 'Apache MD5 ($apr1$)', length: -1, charset: ['crypt'], uses: 'Apache .htpasswd password hash' },
  { name: 'SHA-256 crypt ($5$)', length: -1, charset: ['crypt'], uses: 'Linux/Unix password hash (crypt(3) with $5$ prefix)' },
  { name: 'SHA-512 crypt ($6$)', length: -1, charset: ['crypt'], uses: 'Linux/Unix password hash (crypt(3) with $6$ prefix)', notes: 'Recommended for /etc/shadow' },
  { name: 'Bcrypt ($2a$/$2b$/$2y$)', length: -1, charset: ['crypt'], uses: 'Adaptive password hashing (OpenBSD, modern web apps)', notes: 'Cost factor in second field' },
  { name: 'Blowfish crypt ($2$)', length: -1, charset: ['crypt'], uses: 'Legacy Blowfish-based crypt' },
  { name: 'ext crypt (DES extended, $ext$)', length: -1, charset: ['crypt'], uses: 'Extended DES crypt' },
  { name: 'Argon2id ($argon2id$)', length: -1, charset: ['crypt'], uses: 'Modern memory-hard password hash (PHC winner)' },
  { name: 'Argon2i ($argon2i$)', length: -1, charset: ['crypt'], uses: 'Argon2i variant (side-channel resistant)' },
  { name: 'Scrypt ($scrypt$)', length: -1, charset: ['crypt'], uses: 'Memory-hard password hash' },
  { name: 'PBKDF2 ($pbkdf2$)', length: -1, charset: ['crypt'], uses: 'Key derivation function password hash' },
]

interface Match {
  candidate: HashCandidate
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

function detectCharset(hash: string): Charset {
  if (!hash) return 'other'
  // Crypt-prefixed hashes
  if (/^\$(1|apr1|5|6|2a|2b|2y|2|ext|argon2i|argon2id|scrypt|pbkdf2)\$/.test(hash)) {
    return 'crypt'
  }
  if (HEX_RE.test(hash)) return 'hex'
  // base64url with possible padding
  if (BASE64URL_RE.test(hash) && hash.length >= 16) return 'base64url'
  if (BASE64_STD_RE.test(hash) && hash.length >= 16) return 'base64'
  return 'other'
}

function analyzeHash(hash: string): Match[] {
  const trimmed = hash.trim()
  if (!trimmed) return []
  const charset = detectCharset(trimmed)
  const matches: Match[] = []

  if (charset === 'crypt') {
    // Determine the prefix
    const prefixMap: Record<string, { candidate: HashCandidate; reason: string }> = {
      '1': { candidate: HASH_DB.find((h) => h.name.includes('MD5 crypt'))!, reason: 'Prefix $1$ — classic MD5 crypt' },
      apr1: { candidate: HASH_DB.find((h) => h.name.includes('Apache MD5'))!, reason: 'Prefix $apr1$ — Apache MD5 variant' },
      '5': { candidate: HASH_DB.find((h) => h.name.includes('SHA-256 crypt'))!, reason: 'Prefix $5$ — SHA-256 crypt' },
      '6': { candidate: HASH_DB.find((h) => h.name.includes('SHA-512 crypt'))!, reason: 'Prefix $6$ — SHA-512 crypt' },
      '2a': { candidate: HASH_DB.find((h) => h.name.includes('Bcrypt'))!, reason: 'Prefix $2a$ — bcrypt' },
      '2b': { candidate: HASH_DB.find((h) => h.name.includes('Bcrypt'))!, reason: 'Prefix $2b$ — bcrypt (OpenBSD)' },
      '2y': { candidate: HASH_DB.find((h) => h.name.includes('Bcrypt'))!, reason: 'Prefix $2y$ — bcrypt (PHP $2y$)' },
      '2': { candidate: HASH_DB.find((h) => h.name.includes('Blowfish crypt'))!, reason: 'Prefix $2$ — legacy Blowfish crypt' },
      ext: { candidate: HASH_DB.find((h) => h.name.includes('ext crypt'))!, reason: 'Prefix $ext$ — extended DES crypt' },
      argon2id: { candidate: HASH_DB.find((h) => h.name.includes('Argon2id'))!, reason: 'Prefix $argon2id$ — Argon2id' },
      argon2i: { candidate: HASH_DB.find((h) => h.name.includes('Argon2i'))!, reason: 'Prefix $argon2i$ — Argon2i' },
      scrypt: { candidate: HASH_DB.find((h) => h.name.includes('Scrypt'))!, reason: 'Prefix $scrypt$ — scrypt KDF' },
      pbkdf2: { candidate: HASH_DB.find((h) => h.name.includes('PBKDF2'))!, reason: 'Prefix $pbkdf2$ — PBKDF2' },
    }
    const m = trimmed.match(/^\$([a-zA-Z0-9]+)\$/)
    if (m && prefixMap[m[1]]) {
      const entry = prefixMap[m[1]]
      matches.push({ candidate: entry.candidate, confidence: 'high', reason: entry.reason })
    } else {
      // Generic crypt hash
      matches.push({
        candidate: {
          name: 'crypt(3) format',
          length: -1,
          charset: ['crypt'],
          uses: 'Linux/Unix password hash with $...$ prefix',
        },
        confidence: 'low',
        reason: 'Recognizable crypt-format hash but unknown algorithm prefix',
      })
    }
    return matches
  }

  // For non-crypt formats: match by length + charset
  const len = trimmed.length
  for (const c of HASH_DB) {
    if (c.length === -1) continue
    if (c.length !== len) continue
    if (!c.charset.includes(charset)) continue
    // Confidence is high for hex matches with a unique-ish length; lower for ambiguous
    matches.push({
      candidate: c,
      confidence: 'medium',
      reason: `Length ${len} chars (${charset}) matches expected output size`,
    })
  }

  // If no length matches, look at base64 decoded length
  if (matches.length === 0 && (charset === 'base64' || charset === 'base64url')) {
    const cleaned = charset === 'base64url' ? trimmed.replace(/-/g, '+').replace(/_/g, '/') : trimmed
    try {
      const bin = atob(cleaned)
      const byteLen = bin.length
      for (const c of HASH_DB) {
        if (c.length === -1) continue
        // expected hex chars = byteLen * 2 — see if any candidate matches
        if (c.length === byteLen * 2 && c.charset.includes('hex')) {
          matches.push({
            candidate: { ...c, name: c.name.replace(' (base64)', '') + ' (base64-encoded)' },
            confidence: 'low',
            reason: `Decodes to ${byteLen} bytes — matches ${byteLen * 2}-hex-char digest`,
          })
        }
      }
    } catch {
      // invalid base64 — ignore
    }
  }

  return matches
}

function copyText(text: string) {
  return navigator.clipboard.writeText(text)
}

const SAMPLE_HASHES = [
  { label: 'MD5', value: 'd41d8cd98f00b204e9800998ecf8427e' },
  { label: 'SHA-1', value: 'da39a3ee5e6b4b0d3255bfef95601890afd80709' },
  { label: 'SHA-256', value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
  { label: 'SHA-512', value: 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e' },
  { label: 'Bcrypt', value: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' },
  { label: 'SHA-512 crypt', value: '$6$rounds=5000$saltsalt$ZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZm' },
]

const CONFIDENCE_STYLES: Record<Match['confidence'], { color: string; label: string }> = {
  high: { color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400', label: 'High confidence' },
  medium: { color: 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400', label: 'Possible match' },
  low: { color: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400', label: 'Speculative' },
}

export default function HashIdentifier() {
  const [hash, setHash] = React.useState('')

  const matches = React.useMemo(() => (hash.trim() ? analyzeHash(hash) : []), [hash])

  const charset = React.useMemo(() => {
    if (!hash.trim()) return null
    const c = detectCharset(hash.trim())
    return c
  }, [hash])

  async function copyHash() {
    if (!hash) return
    try {
      await copyText(hash)
      toast.success('Hash copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <FieldLabel className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          Hash string
        </FieldLabel>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="Paste a hash…"
            className="font-mono text-sm flex-1"
            spellCheck={false}
            autoComplete="off"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={copyHash} disabled={!hash}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
            {hash && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHash('')}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Quick samples */}
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-1.5">Try a sample hash:</div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_HASHES.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setHash(s.value)}
                className="text-xs px-2 py-1 rounded-md border border-border hover:border-primary/50 hover:bg-accent transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        {hash.trim() && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="Length" value={`${hash.trim().length} chars`} />
            <Stat label="Charset" value={charset ? charset.toUpperCase() : '—'} />
            <Stat label="Byte estimate" value={charset === 'hex' ? `${hash.trim().length / 2} bytes` : charset === 'crypt' ? 'variable' : '?'} />
            <Stat label="Matches" value={`${matches.length}`} />
          </div>
        )}
      </ToolCardWrapper>

      {/* Results */}
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <h3 className="text-sm font-semibold">Possible hash types</h3>
          <p className="text-xs text-muted-foreground">Ranked by length & charset heuristics.</p>
        </div>
        <Separator className="mb-3" />

        {!hash.trim() ? (
          <EmptyState message="Enter a hash above to identify its likely type(s). Detection works by length, character set, and crypt-style prefixes." />
        ) : matches.length === 0 ? (
          <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">No known hash format detected</p>
              <p className="text-xs text-muted-foreground mt-1">
                The input doesn&apos;t match any standard hash length, character set, or crypt prefix
                in our database. It may be a custom hash, encrypted (not hashed) data, or simply a
                non-hash string.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((m, i) => {
              const cs = CONFIDENCE_STYLES[m.confidence]
              return (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${cs.color}`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      {m.confidence === 'high' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : m.confidence === 'medium' ? (
                        <Fingerprint className="h-4 w-4 shrink-0" />
                      ) : (
                        <Search className="h-4 w-4 shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{m.candidate.name}</div>
                        <div className="text-xs opacity-80">{m.reason}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-background/60 text-xs">
                      {cs.label}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-xs">
                    <MetaRow label="Length" value={m.candidate.length === -1 ? 'variable' : `${m.candidate.length} chars`} />
                    <MetaRow
                      label="Charset"
                      value={m.candidate.charset.join(' / ')}
                    />
                    <MetaRow
                      label="Uses"
                      value={m.candidate.uses}
                      full
                    />
                    {m.candidate.notes && (
                      <MetaRow label="Notes" value={m.candidate.notes} full />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ToolCardWrapper>

      {/* Reference card */}
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">About hash identification</h3>
        </div>
        <Separator className="mb-3" />
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li className="flex items-start gap-1.5">
            <Database className="h-3.5 w-3.5 mt-1 shrink-0" />
            <span>
              Our database covers 40+ hash types: MD family (MD4/MD5), SHA-1, SHA-2 (224/256/384/512),
              SHA-3 (Keccak), RIPEMD, Tiger, Haval, Whirlpool, Snefru, GOST, NTLM, MySQL, CRC32/64, and
              crypt(3) password hashes ($1$ MD5 crypt, $5/$6 SHA crypt, $2$ bcrypt, $argon2$, $scrypt$, $pbkdf2$).
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <Key className="h-3.5 w-3.5 mt-1 shrink-0" />
            <span>
              Heuristics combine exact length, character set (hex / base64 / base64url / crypt-prefixed),
              and known magic prefixes. A &ldquo;high&rdquo; confidence result is essentially certain; a
              &ldquo;medium&rdquo; result is likely; a &ldquo;low&rdquo; result is a plausible guess.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <Shield className="h-3.5 w-3.5 mt-1 shrink-0" />
            <span>
              Note that hashes are <strong>not reversible</strong> — identifying the type is the first
              step before any dictionary or brute-force attack. This tool is for educational and forensic
              purposes only.
            </span>
          </li>
          <li>
            Everything is 100% client-side — your hash never leaves the browser.
          </li>
        </ul>
      </ToolCardWrapper>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium font-mono truncate">{value}</div>
    </div>
  )
}

function MetaRow({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2 sm:col-span-3' : ''}>
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground/90">{value}</span>
    </div>
  )
}
