'use client'

import * as React from 'react'
import { PDFDocument } from 'pdf-lib'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Upload,
  FileText,
  Download,
  Loader2,
  X,
  GripVertical,
  RotateCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel, EmptyState } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PageCard {
  id: string
  originalIndex: number
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

interface SortablePageProps {
  page: PageCard
  displayNumber: number
}

function SortablePage({ page, displayNumber }: SortablePageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.7 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border-2 bg-card p-3 transition-colors',
        isDragging ? 'border-emerald-500 shadow-lg' : 'border-border hover:border-emerald-500/60'
      )}
    >
      <button
        type="button"
        className="absolute left-1 top-1 flex h-6 w-6 cursor-grab items-center justify-center rounded text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex aspect-[3/4] w-full max-w-[110px] items-center justify-center rounded-md bg-gradient-to-br from-rose-500/10 to-orange-500/10">
        <FileText className="h-8 w-8 text-rose-600/70" />
      </div>
      <div className="text-center">
        <p className="text-xs font-medium">Page {displayNumber}</p>
        <p className="text-[10px] text-muted-foreground">
          orig #{page.originalIndex + 1}
        </p>
      </div>
      <Badge
        variant="secondary"
        className="absolute right-1 top-1 h-5 min-w-5 justify-center px-1 text-[10px]"
      >
        {displayNumber}
      </Badge>
    </div>
  )
}

export default function PdfReorder() {
  const [file, setFile] = React.useState<File | null>(null)
  const [pages, setPages] = React.useState<PageCard[]>([])
  const [busy, setBusy] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadFile = async (f: File) => {
    if (f.type !== 'application/pdf') {
      toast.error('Please select a PDF file')
      return
    }
    try {
      const buf = await f.arrayBuffer()
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
      setFile(f)
      setPages(
        Array.from({ length: doc.getPageCount() }, (_, i) => ({
          id: `page-${i}`,
          originalIndex: i,
        }))
      )
    } catch (err) {
      console.error(err)
      toast.error('Failed to read PDF.')
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) loadFile(f)
  }

  const reset = () => {
    setFile(null)
    setPages([])
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setPages((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id)
      const newIndex = prev.findIndex((p) => p.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const reverse = () => setPages((prev) => [...prev].reverse())

  const apply = async () => {
    if (!file || pages.length === 0) return
    setBusy(true)
    try {
      const buf = await file.arrayBuffer()
      const src = await PDFDocument.load(buf, { ignoreEncryption: true })
      const out = await PDFDocument.create()
      const indices = pages.map((p) => p.originalIndex)
      const copied = await out.copyPages(src, indices)
      copied.forEach((p) => out.addPage(p))
      const bytes = await out.save()
      download(
        new Blob([bytes as BlobPart], { type: 'application/pdf' }),
        file.name.replace(/\.pdf$/i, '') + '_reordered.pdf',
      )
      toast.success(`Reordered ${pages.length} pages`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to reorder PDF.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolCardWrapper>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <FieldLabel>Pages (drag to reorder)</FieldLabel>
          {!file ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-12 text-center transition-colors',
                dragging
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-border hover:border-emerald-500/60 hover:bg-accent/40'
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <Upload className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium">Drop a PDF here or click to upload</p>
              <p className="text-xs text-muted-foreground">Single PDF file</p>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) loadFile(f)
                  e.target.value = ''
                }}
              />
            </div>
          ) : pages.length === 0 ? (
            <EmptyState message="No pages found in this PDF." />
          ) : (
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[480px] overflow-y-auto p-1">
                    {pages.map((p, idx) => (
                      <SortablePage key={p.id} page={p} displayNumber={idx + 1} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Drag the <GripVertical className="inline h-3 w-3 align-text-bottom" /> handle on each card to rearrange.
            Keyboard: focus a card, press Space to pick up, arrow keys to move, Space again to drop.
          </p>
        </div>

        <div className="space-y-4">
          <FieldLabel>Summary</FieldLabel>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pages</span>
              <span className="font-semibold">{pages.length}</span>
            </div>
            {file && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Size</span>
                <span className="font-semibold">{formatSize(file.size)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order</span>
              <span className="font-semibold">
                {pages.map((p) => p.originalIndex + 1).join(', ') || '—'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={reverse}
              disabled={busy || pages.length === 0}
              variant="outline"
              className="gap-2"
            >
              <RotateCw className="h-4 w-4" /> Reverse order
            </Button>
            <Button
              onClick={apply}
              disabled={busy || pages.length === 0}
              className="gap-2"
              size="lg"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {busy ? 'Reordering...' : 'Apply & Download'}
            </Button>
            {file && (
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={busy}
                className="gap-1.5 text-muted-foreground"
              >
                <X className="h-4 w-4" /> Remove file
              </Button>
            )}
          </div>
        </div>
      </div>
    </ToolCardWrapper>
  )
}
