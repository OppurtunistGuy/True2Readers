import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// The app has one indexable page today. Add an entry for every new indexable
// page (for example per-book pages). `lastModified` is deliberately omitted
// until each entry can carry its real content date: a made-up date (such as
// "now" on every build) teaches search engines to ignore the field.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/` }]
}
