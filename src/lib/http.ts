import { NextResponse } from 'next/server'

/**
 * Client address for rate limiting. On Vercel the platform sets
 * `x-forwarded-for` itself (client-supplied values are overwritten), so the
 * first entry is the real client. Falls back to a shared bucket.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim() || 'unknown'
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

export function tooMany(retryAfter: number, message = 'Too many requests. Please try again later.') {
  return NextResponse.json({ error: message }, { status: 429, headers: { 'Retry-After': String(retryAfter) } })
}

type JsonResult = { ok: true; data: any } | { ok: false; res: NextResponse }

/** Parse a JSON body, refusing anything larger than `maxBytes` (413) or not valid JSON (400). */
export async function readJson(req: Request, maxBytes: number): Promise<JsonResult> {
  const declared = Number(req.headers.get('content-length') ?? 0)
  if (declared > maxBytes) {
    return { ok: false, res: NextResponse.json({ error: 'Request body too large.' }, { status: 413 }) }
  }
  const text = await req.text()
  if (text.length > maxBytes) {
    return { ok: false, res: NextResponse.json({ error: 'Request body too large.' }, { status: 413 }) }
  }
  try {
    return { ok: true, data: JSON.parse(text) }
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }
  }
}
