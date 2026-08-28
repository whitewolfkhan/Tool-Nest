'use client'

import * as React from 'react'
import { Coins, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper } from '@/components/tool-page-shell'

type Side = 'heads' | 'tails'

interface FlipRecord {
  side: Side
  at: number
}

export default function CoinFlip() {
  const [result, setResult] = React.useState<Side | null>(null)
  const [flipping, setFlipping] = React.useState(false)
  const [history, setHistory] = React.useState<FlipRecord[]>([])

  const headsCount = history.filter((h) => h.side === 'heads').length
  const tailsCount = history.filter((h) => h.side === 'tails').length
  const total = history.length

  const flip = () => {
    if (flipping) return
    setFlipping(true)
    setResult(null)
    // Spin animation duration: 800ms
    setTimeout(() => {
      const arr = new Uint8Array(1)
      crypto.getRandomValues(arr)
      const side: Side = arr[0] % 2 === 0 ? 'heads' : 'tails'
      setResult(side)
      setHistory((h) => [{ side, at: Date.now() }, ...h].slice(0, 20))
      setFlipping(false)
    }, 800)
  }

  const reset = () => {
    setResult(null)
    setHistory([])
  }

  const headsPct = total > 0 ? (headsCount / total) * 100 : 50
  const tailsPct = total > 0 ? (tailsCount / total) * 100 : 50

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Flip a coin</h2>
          </div>
          <div className="[perspective:1000px]">
            <div
              className={`relative h-40 w-40 transition-transform duration-700 [transform-style:preserve-3d] ${
                flipping ? 'animate-spin' : ''
              }`}
              style={{
                transform: result
                  ? result === 'heads'
                    ? 'rotateY(0deg)'
                    : 'rotateY(180deg)'
                  : 'rotateY(0deg)',
              }}
            >
              {/* Heads */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 shadow-lg [backface-visibility:hidden] flex-col gap-1"
              >
                <div className="text-4xl font-bold">H</div>
                <div className="text-xs font-semibold tracking-wide uppercase">
                  Heads
                </div>
              </div>
              {/* Tails */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 shadow-lg [backface-visibility:hidden] flex-col gap-1 [transform:rotateY(180deg)]"
              >
                <div className="text-4xl font-bold">T</div>
                <div className="text-xs font-semibold tracking-wide uppercase">
                  Tails
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            {result && !flipping && (
              <div className="text-2xl font-bold mb-1 capitalize">
                {result}
              </div>
            )}
            {flipping && (
              <div className="text-2xl font-bold text-muted-foreground mb-1">
                Flipping…
              </div>
            )}
            {!result && !flipping && (
              <div className="text-2xl font-bold text-muted-foreground mb-1">
                Ready
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Cryptographically fair — uses crypto.getRandomValues
            </p>
          </div>
          <Button
            onClick={flip}
            disabled={flipping}
            className="gap-2 h-11 px-8 text-base"
          >
            <Coins className={`h-5 w-5 ${flipping ? 'animate-spin' : ''}`} />
            {flipping ? 'Flipping…' : 'Flip Coin'}
          </Button>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-semibold">Statistics</h2>
          <div className="flex gap-2 items-center">
            <Badge variant="secondary">{total} flips</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              disabled={total === 0}
              className="gap-1.5"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-amber-300/40 bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
            <div className="text-xs text-muted-foreground">Heads</div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {headsCount}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {headsPct.toFixed(1)}%
            </div>
          </div>
          <div className="rounded-lg border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
            <div className="text-xs text-muted-foreground">Tails</div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {tailsCount}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {tailsPct.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="h-3 rounded-full overflow-hidden bg-muted flex">
          <div
            className="bg-amber-400 transition-all"
            style={{ width: `${headsPct}%` }}
          />
          <div
            className="bg-amber-600 transition-all"
            style={{ width: `${tailsPct}%` }}
          />
        </div>

        {history.length > 0 && (
          <div className="mt-5">
            <div className="text-sm font-medium mb-2">Last 20 flips</div>
            <div className="flex flex-wrap gap-1.5">
              {history.map((h, i) => (
                <span
                  key={i}
                  title={new Date(h.at).toLocaleTimeString()}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ${
                    h.side === 'heads'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200'
                  }`}
                >
                  {h.side === 'heads' ? 'H' : 'T'}
                </span>
              ))}
            </div>
          </div>
        )}
      </ToolCardWrapper>
    </div>
  )
}
