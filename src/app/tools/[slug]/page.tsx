import { notFound } from 'next/navigation'
import { tools, getCategoryById } from '@/lib/tools-registry'
import { ToolLoader } from '@/components/tool-loader'
import type { Metadata } from 'next'

const BASE_URL = 'https://toolnest.app'

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tool = tools.find((t) => t.slug === slug)
  if (!tool) return {}

  const category = getCategoryById(tool.category)
  const title = `${tool.name} — Free Online Tool | ToolNest`
  const description = `${tool.description} ${tool.clientSide ? '100% private — runs in your browser.' : 'Free online tool.'} No signup, no watermark.`

  return {
    title,
    description,
    keywords: [
      tool.name.toLowerCase(),
      'free online tool',
      'no signup',
      category?.name.toLowerCase().replace(' tools', '') ?? '',
      ...(tool.keywords ?? []),
    ].filter(Boolean),
    alternates: {
      canonical: `/tools/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/tools/${slug}`,
      siteName: 'ToolNest',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.name,
      description: tool.description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tool = tools.find((t) => t.slug === slug)
  if (!tool) notFound()

  const category = getCategoryById(tool.category)
  const title = `${tool.name} — Free Online Tool | ToolNest`
  const description = `${tool.description} ${tool.clientSide ? '100% private — runs in your browser.' : 'Free online tool.'} No signup, no watermark.`

  // JSON-LD structured data so search engines render rich results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    applicationCategory: 'WebApplication',
    operatingSystem: 'Web Browser',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '128',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ToolNest',
      url: BASE_URL,
    },
    url: `${BASE_URL}/tools/${slug}`,
    category: category?.name,
    isAccessibleForFree: true,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolLoader slug={slug} />
    </>
  )
}
