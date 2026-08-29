import { notFound } from 'next/navigation'
import { tools } from '@/lib/tools-registry'
import { ToolLoader } from '@/components/tool-loader'

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tool = tools.find((t) => t.slug === slug)
  if (!tool) return {}
  return {
    title: `${tool.name} — Free Online Tool | ToolNest`,
    description: tool.description,
  }
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tool = tools.find((t) => t.slug === slug)
  if (!tool) notFound()
  return <ToolLoader slug={slug} />
}
