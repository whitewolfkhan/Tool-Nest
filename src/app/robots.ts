import type { MetadataRoute } from 'next'

const BASE_URL = 'https://toolnest.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // No disallow rules — all pages are indexable.
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
