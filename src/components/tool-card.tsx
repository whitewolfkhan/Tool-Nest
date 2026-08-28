import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { Tool, Category } from '@/lib/tools-registry'
import { getCategoryById } from '@/lib/tools-registry'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  tool: Tool
  category?: Category
  className?: string
}

export function ToolCard({ tool, category, className }: ToolCardProps) {
  const cat = category ?? getCategoryById(tool.category)
  const Icon = cat?.icon

  return (
    <Link href={`/tools/${tool.slug}`} className={cn('group block', className)}>
      <Card className="h-full p-4 transition-all hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5">
        <div className="flex items-start gap-3">
          {Icon && (
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br',
                cat?.gradient
              )}
            >
              <Icon className={cn('h-5 w-5', cat?.color)} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-sm truncate">{tool.name}</h3>
              {tool.popular && (
                <span className="text-[10px] font-medium text-primary shrink-0">★</span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </Card>
    </Link>
  )
}
