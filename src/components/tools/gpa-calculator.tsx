'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

const GRADES: Record<string, number> = {
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D': 1.0,
  'F': 0.0,
}

interface Course {
  id: string
  name: string
  credits: string
  grade: string
}

let counter = 0
function newId(): string {
  counter += 1
  return `course-${counter}`
}

function gpaColor(gpa: number): string {
  if (gpa >= 3.7) return 'text-emerald-500'
  if (gpa >= 3.0) return 'text-lime-500'
  if (gpa >= 2.0) return 'text-amber-500'
  if (gpa > 0) return 'text-rose-500'
  return 'text-muted-foreground'
}

function gpaLabel(gpa: number): string {
  if (gpa >= 3.7) return 'Excellent'
  if (gpa >= 3.3) return 'Very Good'
  if (gpa >= 3.0) return 'Good'
  if (gpa >= 2.0) return 'Satisfactory'
  if (gpa > 0) return 'Needs Improvement'
  return '—'
}

export default function GpaCalculator() {
  const [courses, setCourses] = React.useState<Course[]>([
    { id: newId(), name: '', credits: '3', grade: 'A' },
  ])

  const addRow = () => {
    setCourses((cs) => [...cs, { id: newId(), name: '', credits: '3', grade: 'A' }])
  }
  const removeRow = (id: string) => {
    setCourses((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs))
  }
  const update = (id: string, field: keyof Course, value: string) => {
    setCourses((cs) =>
      cs.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    )
  }

  let totalCredits = 0
  let totalPoints = 0
  courses.forEach((c) => {
    const credits = parseFloat(c.credits) || 0
    const points = GRADES[c.grade] ?? 0
    if (credits > 0) {
      totalCredits += credits
      totalPoints += credits * points
    }
  })
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0

  return (
    <ToolCardWrapper>
      {/* Header row */}
      <div className="hidden sm:grid grid-cols-12 gap-2 mb-2 text-xs font-medium text-muted-foreground">
        <div className="col-span-4">Course Name</div>
        <div className="col-span-3">Credits</div>
        <div className="col-span-3">Grade</div>
        <div className="col-span-2" />
      </div>

      <div className="space-y-2">
        {courses.map((c, idx) => (
          <div key={c.id} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-12 sm:col-span-4">
              <Input
                value={c.name}
                onChange={(e) => update(c.id, 'name', e.target.value)}
                placeholder={`Course ${idx + 1} (optional)`}
              />
            </div>
            <div className="col-span-5 sm:col-span-3">
              <Select
                value={c.credits}
                onValueChange={(v) => update(c.id, 'credits', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} credit{n > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-5 sm:col-span-3">
              <Select
                value={c.grade}
                onValueChange={(v) => update(c.id, 'grade', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(GRADES).map((g) => (
                    <SelectItem key={g} value={g}>
                      {g} ({GRADES[g].toFixed(1)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-2 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRow(c.id)}
                disabled={courses.length === 1}
                aria-label="Remove course"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={addRow}
        className="w-full mt-3"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Course
      </Button>

      <div className="mt-6 text-center rounded-lg bg-muted/50 p-6">
        <div className="text-sm text-muted-foreground mb-1">
          Your GPA (4.0 scale)
        </div>
        <div className={`text-5xl font-bold tabular-nums ${gpaColor(gpa)}`}>
          {gpa.toFixed(2)}
        </div>
        <div className="text-sm font-medium text-muted-foreground mt-2">
          {gpaLabel(gpa)} · {totalCredits} credit{totalCredits !== 1 ? 's' : ''} earned
        </div>
      </div>
    </ToolCardWrapper>
  )
}
