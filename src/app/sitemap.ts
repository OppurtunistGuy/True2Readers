import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// The app is a single route today. Add an entry here for every new
// indexable page (e.g. per-book pages) as they are introduced.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
