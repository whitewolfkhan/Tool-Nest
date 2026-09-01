'use client'

import * as React from 'react'
import {
  LayoutGrid,
  Copy,
  Sparkles,
  RotateCcw,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  Code2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ToolCardWrapper,
  FieldLabel,
  CopyButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse'
type JustifyContent = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
type AlignItems = 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline'
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse'
type AlignSelf = 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'

interface ItemState {
  grow: number
  shrink: number
  basis: string
  alignSelf: AlignSelf
  color: string
}

const ITEM_COLORS = [
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
]

interface ContainerState {
  flexDirection: FlexDirection
  justifyContent: JustifyContent
  alignItems: AlignItems
  flexWrap: FlexWrap
  gap: number
}

const PRESETS: { name: string; container: ContainerState; itemCount: number; items: ItemState[] }[] = [
  {
    name: 'Centered',
    container: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap', gap: 8 },
    itemCount: 1,
    items: [{ grow: 0, shrink: 0, basis: 'auto', alignSelf: 'auto', color: ITEM_COLORS[0] }],
  },
  {
    name: 'Space between',
    container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: 8 },
    itemCount: 3,
    items: [0, 1, 2].map((i) => ({ grow: 0, shrink: 0, basis: 'auto', alignSelf: 'auto', color: ITEM_COLORS[i % 8] })),
  },
  {
    name: 'Sidebar + content',
    container: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', flexWrap: 'nowrap', gap: 12 },
    itemCount: 2,
    items: [
      { grow: 0, shrink: 0, basis: '200px', alignSelf: 'auto', color: ITEM_COLORS[2] },
      { grow: 1, shrink: 1, basis: '0', alignSelf: 'auto', color: ITEM_COLORS[0] },
    ],
  },
  {
    name: 'Vertical stack',
    container: { flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch', flexWrap: 'nowrap', gap: 8 },
    itemCount: 3,
    items: [0, 1, 2].map((i) => ({ grow: 1, shrink: 0, basis: '0', alignSelf: 'auto', color: ITEM_COLORS[i % 8] })),
  },
  {
    name: 'Equal columns',
    container: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', flexWrap: 'wrap', gap: 12 },
    itemCount: 4,
    items: [0, 1, 2, 3].map((i) => ({ grow: 1, shrink: 1, basis: '0', alignSelf: 'auto', color: ITEM_COLORS[i % 8] })),
  },
  {
    name: 'Card grid (wrap)',
    container: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
    itemCount: 6,
    items: [0, 1, 2, 3, 4, 5].map((i) => ({ grow: 0, shrink: 0, basis: '120px', alignSelf: 'auto', color: ITEM_COLORS[i % 8] })),
  },
]

function buildContainerCss(c: ContainerState, items: ItemState[]): string {
  const lines: string[] = []
  lines.push('.container {')
  lines.push(`  display: flex;`)
  lines.push(`  flex-direction: ${c.flexDirection};`)
  lines.push(`  justify-content: ${c.justifyContent};`)
  lines.push(`  align-items: ${c.alignItems};`)
  lines.push(`  flex-wrap: ${c.flexWrap};`)
  lines.push(`  gap: ${c.gap}px;`)
  lines.push('}')
  items.forEach((it, i) => {
    lines.push(`.item-${i + 1} {`)
    lines.push(`  flex: ${it.grow} ${it.shrink} ${it.basis};`)
    if (it.alignSelf !== 'auto') lines.push(`  align-self: ${it.alignSelf};`)
    lines.push('}')
  })
  return lines.join('\n')
}

export default function CssFlexboxPlayground() {
  const [container, setContainer] = React.useState<ContainerState>({
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
    gap: 8,
  })
  const [items, setItems] = React.useState<ItemState[]>(
    [0, 1, 2].map((i) => ({ grow: 0, shrink: 0, basis: 'auto', alignSelf: 'auto', color: ITEM_COLORS[i % 8] })),
  )
  const [activeItem, setActiveItem] = React.useState(0)

  const css = React.useMemo(() => buildContainerCss(container, items), [container, items])

  function setItemCount(n: number) {
    const next = [...items]
    if (n > next.length) {
      while (next.length < n) {
        next.push({ grow: 0, shrink: 0, basis: 'auto', alignSelf: 'auto', color: ITEM_COLORS[next.length % 8] })
      }
    } else {
      next.length = n
    }
    setItems(next)
    if (activeItem >= n) setActiveItem(Math.max(0, n - 1))
  }

  function updateActive(patch: Partial<ItemState>) {
    setItems((prev) => prev.map((it, i) => (i === activeItem ? { ...it, ...patch } : it)))
  }

  function applyPreset(preset: typeof PRESETS[number]) {
    setContainer(preset.container)
    setItems(preset.items.map((it) => ({ ...it })))
    setActiveItem(0)
    toast.success(`Loaded preset: ${preset.name}`)
  }

  function reset() {
    setContainer({ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', flexWrap: 'nowrap', gap: 8 })
    setItems([0, 1, 2].map((i) => ({ grow: 0, shrink: 0, basis: 'auto', alignSelf: 'auto', color: ITEM_COLORS[i % 8] })))
    setActiveItem(0)
    toast.info('Reset to defaults')
  }

  const active = items[activeItem]

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <FieldLabel className="mb-0 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            Items: <span className="font-mono text-primary">{items.length}</span>
          </FieldLabel>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setItemCount(items.length + 1)} disabled={items.length >= 8}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setItemCount(items.length - 1)} disabled={items.length <= 1}>
              <Minus className="h-3.5 w-3.5" /> Remove
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-lg border border-border bg-card/30 p-4 mb-5 min-h-[260px]">
          <div
            className="h-[220px] w-full rounded-md bg-muted/30 border border-dashed border-border p-3"
            style={{
              display: 'flex',
              flexDirection: container.flexDirection,
              justifyContent: container.justifyContent,
              alignItems: container.alignItems,
              flexWrap: container.flexWrap,
              gap: `${container.gap}px`,
            }}
          >
            {items.map((it, i) => (
              <div
                key={i}
                onClick={() => setActiveItem(i)}
                className={`${it.color} ${activeItem === i ? 'ring-2 ring-offset-2 ring-foreground/60 ring-offset-background' : 'ring-0'} cursor-pointer flex items-center justify-center text-white font-semibold text-sm rounded-md transition-shadow min-w-[40px] min-h-[40px]`}
                style={{
                  flexGrow: it.grow,
                  flexShrink: it.shrink,
                  flexBasis: it.basis === '0' ? '0%' : it.basis,
                  alignSelf: it.alignSelf,
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Click an item to edit its flex properties.</p>
        </div>

        <Tabs defaultValue="container">
          <TabsList>
            <TabsTrigger value="container">Container</TabsTrigger>
            <TabsTrigger value="item">Active item</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="code">CSS</TabsTrigger>
          </TabsList>

          <TabsContent value="container" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel>flex-direction</FieldLabel>
                <Select value={container.flexDirection} onValueChange={(v) => setContainer({ ...container, flexDirection: v as FlexDirection })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="row">row</SelectItem>
                    <SelectItem value="row-reverse">row-reverse</SelectItem>
                    <SelectItem value="column">column</SelectItem>
                    <SelectItem value="column-reverse">column-reverse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>justify-content</FieldLabel>
                <Select value={container.justifyContent} onValueChange={(v) => setContainer({ ...container, justifyContent: v as JustifyContent })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flex-start">flex-start</SelectItem>
                    <SelectItem value="center">center</SelectItem>
                    <SelectItem value="flex-end">flex-end</SelectItem>
                    <SelectItem value="space-between">space-between</SelectItem>
                    <SelectItem value="space-around">space-around</SelectItem>
                    <SelectItem value="space-evenly">space-evenly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>align-items</FieldLabel>
                <Select value={container.alignItems} onValueChange={(v) => setContainer({ ...container, alignItems: v as AlignItems })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stretch">stretch</SelectItem>
                    <SelectItem value="flex-start">flex-start</SelectItem>
                    <SelectItem value="center">center</SelectItem>
                    <SelectItem value="flex-end">flex-end</SelectItem>
                    <SelectItem value="baseline">baseline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>flex-wrap</FieldLabel>
                <Select value={container.flexWrap} onValueChange={(v) => setContainer({ ...container, flexWrap: v as FlexWrap })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nowrap">nowrap</SelectItem>
                    <SelectItem value="wrap">wrap</SelectItem>
                    <SelectItem value="wrap-reverse">wrap-reverse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>gap: <span className="font-mono text-primary">{container.gap}px</span></FieldLabel>
                <Slider value={[container.gap]} min={0} max={48} step={1} onValueChange={(v) => setContainer({ ...container, gap: v[0] })} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="item" className="mt-4 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">Select item:</span>
              {items.map((_, i) => (
                <Button
                  key={i}
                  variant={activeItem === i ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setActiveItem(i)}
                >
                  {i + 1}
                </Button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setActiveItem(Math.max(0, activeItem - 1))} disabled={activeItem === 0}>
                  <ChevronUp className="h-3.5 w-3.5 rotate-[-90deg]" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setActiveItem(Math.min(items.length - 1, activeItem + 1))} disabled={activeItem === items.length - 1}>
                  <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" />
                </Button>
              </div>
            </div>
            {active && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <FieldLabel>flex-grow: <span className="font-mono text-primary">{active.grow}</span></FieldLabel>
                  <Slider value={[active.grow]} min={0} max={5} step={1} onValueChange={(v) => updateActive({ grow: v[0] })} />
                </div>
                <div>
                  <FieldLabel>flex-shrink: <span className="font-mono text-primary">{active.shrink}</span></FieldLabel>
                  <Slider value={[active.shrink]} min={0} max={5} step={1} onValueChange={(v) => updateActive({ shrink: v[0] })} />
                </div>
                <div>
                  <FieldLabel>flex-basis</FieldLabel>
                  <Input value={active.basis} onChange={(e) => updateActive({ basis: e.target.value })} className="font-mono text-sm" placeholder="auto | 0 | 200px" />
                </div>
                <div>
                  <FieldLabel>align-self</FieldLabel>
                  <Select value={active.alignSelf} onValueChange={(v) => updateActive({ alignSelf: v as AlignSelf })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">auto</SelectItem>
                      <SelectItem value="flex-start">flex-start</SelectItem>
                      <SelectItem value="center">center</SelectItem>
                      <SelectItem value="flex-end">flex-end</SelectItem>
                      <SelectItem value="stretch">stretch</SelectItem>
                      <SelectItem value="baseline">baseline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="rounded-md bg-muted/40 border border-border p-3 text-xs font-mono">
              flex: {active.grow} {active.shrink} {active.basis};{active.alignSelf !== 'auto' ? ` align-self: ${active.alignSelf};` : ''}
            </div>
          </TabsContent>

          <TabsContent value="presets" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="text-left rounded-lg border border-border p-3 hover:border-primary/60 hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium mb-2">{p.name}</p>
                  <div
                    className="h-16 w-full rounded border border-dashed border-border/60 flex p-1"
                    style={{
                      flexDirection: p.container.flexDirection,
                      justifyContent: p.container.justifyContent,
                      alignItems: p.container.alignItems,
                      gap: `${Math.min(p.container.gap, 6)}px`,
                    }}
                  >
                    {p.items.map((it, i) => (
                      <div key={i} className={`${it.color} rounded-sm`} style={{ flexGrow: it.grow, flexBasis: it.basis === '0' ? '0%' : it.basis, minHeight: 6, minWidth: 6 }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            <div className="relative">
              <div className="absolute right-2 top-2 z-10">
                <CopyButton text={css} label="Copy CSS" />
              </div>
              <pre className="rounded-lg border border-border bg-zinc-950 p-4 pt-4 overflow-x-auto text-xs leading-5 font-mono text-emerald-200">
                {css}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5" />
              Container selectors are named <code className="font-mono">.container</code> and items are <code className="font-mono">.item-1</code>, <code className="font-mono">.item-2</code>, etc.
            </p>
          </TabsContent>
        </Tabs>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Flexbox cheat sheet</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <Cheat title="flex-direction" items={['row: left→right (default)', 'row-reverse: right→left', 'column: top→bottom', 'column-reverse: bottom→top']} />
          <Cheat title="justify-content (main axis)" items={['flex-start, center, flex-end', 'space-between: edges, gaps', 'space-around: ½ gaps at edges', 'space-evenly: equal gaps everywhere']} />
          <Cheat title="align-items (cross axis)" items={['stretch: fill (default)', 'flex-start, center, flex-end', 'baseline: align text baselines']} />
          <Cheat title="flex (shorthand)" items={['0 0 auto: fixed size', '1 1 0: grow equally', '0 0 200px: fixed 200px', '0 1 auto: can shrink, default size']} />
        </div>
      </ToolCardWrapper>
    </div>
  )
}

function Cheat({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="font-semibold text-foreground mb-1.5">{title}</p>
      <ul className="space-y-1 text-muted-foreground">
        {items.map((it, i) => (
          <li key={i} className="font-mono leading-5">{it}</li>
        ))}
      </ul>
    </div>
  )
}
