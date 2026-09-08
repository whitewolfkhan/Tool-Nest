import type { MetadataRoute } from 'next'
import { tools } from '@/lib/tools-registry'

const BASE_URL = 'https://toolnest.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Homepage
  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/browse`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Static info pages
    ...['/about', '/privacy', '/terms', '/contact'].map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]

  // Each tool gets its own URL with high priority (these are the main content)
  for (const tool of tools) {
    entries.push({
      url: `${BASE_URL}/tools/${tool.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: tool.popular ? 0.9 : 0.7,
    })
  }

  return entries
}
