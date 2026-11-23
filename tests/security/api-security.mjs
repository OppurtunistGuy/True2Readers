/**
 * True2Readers — API & configuration security checks.
 *
 * Every test asserts the SECURE behaviour, so a FAIL is a finding. Each test
 * carries a severity and the evidence it saw. Output: EVIDENCE_DIR/security.json
 *
 * ONLY run this against a local/dev instance with a throwaway database
 * (it creates test accounts and fires bursts of requests):
 *   DATABASE_URL=file:/tmp/test.db npm run dev
 *   BASE_URL=http://localhost:3001 EVIDENCE_DIR=./uat-evidence node tests/security/api-security.mjs
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { execSync, execFileSync } from 'node:child_process'

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const OUT = process.env.EVIDENCE_DIR || './uat-evidence'
const REPO = process.env.REPO_DIR || process.cwd()
fs.mkdirSync(OUT, { recursive: true })

if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(BASE)) {
  console.error(`Refusing to run against ${BASE}: this suite is for local instances only.`)
  process.exit(2)
}

const results = []
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
/** Run a shell command; "no output / non-zero exit" (e.g. git grep with no match) becomes ''. */
const sh = (cmd) => {
  try {
    return execSync(cmd, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString()
  } catch {
    return ''
  }
}
const J = (o) => JSON.stringify(o)
const rid = crypto.randomBytes(4).toString('hex')

async function req(method, url, { body, cookie, headers = {}, raw } = {}) {
  const t0 = Date.now()
  const res = await fetch(BASE + url, {
    method,
    redirect: 'manual',
    headers: { ...(body !== undefined && !raw ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
    body: raw ?? (body !== undefined ? J(body) : undefined),
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {}
  return { status: res.status, headers: res.headers, text, json, ms: Date.now() - t0, setCookie: res.headers.getSetCookie?.() ?? [] }
}
const cookieOf = (r) => r.setCookie.map((c) => c.split(';')[0]).join('; ')

async function test(id, severity, title, fn) {
  const rec = { id, severity, title, status: 'PASS', evidence: [] }
  const ev = (m) => rec.evidence.push(m)
  try {
    const verdict = await fn(ev)
    if (verdict && verdict.fail) {
      rec.status = 'FINDING'
      rec.why = verdict.fail
    }
  } catch (e) {
    rec.status = 'ERROR'
    rec.why = String(e.message || e)
  }
  results.push(rec)
  console.log(`${rec.status === 'PASS' ? '✔' : rec.status === 'FINDING' ? '⚠' : '✘'} ${id} [${severity}] ${title}${rec.why ? '\n     → ' + rec.why : ''}`)
}

// ── set-up: one throwaway user ─────────────────────────────────────────────
const email = `uat-sec-${rid}@example.test`
const password = `Uat-${rid}-Pass!9`
const signup = await req('POST', '/api/auth/signup', { body: { email, password } })
if (signup.status !== 200) {
  console.error('Set-up failed (cannot create the test user):', signup.status, signup.text.slice(0, 200))
  process.exit(2)
}
const me = signup.json.user
const session = cookieOf(signup)

// ── A. Authentication & sessions ───────────────────────────────────────────
/** The default secret an older revision of src/lib/auth.ts shipped (found in git history, never printed). */
function historicalSecret() {
  for (const h of sh('git log --all --format=%H -- src/lib/auth.ts').split('\n').filter(Boolean)) {
    const m = sh(`git show ${h}:src/lib/auth.ts`).match(/process\.env\.SESSION_SECRET\s*\|\|\s*'([^']+)'/)
    if (m) return m[1]
  }
  return null
}

await test('S01', 'High', 'Session tokens cannot be forged with a publicly known secret', async (ev) => {
  const src = fs.readFileSync(path.join(REPO, 'src/lib/auth.ts'), 'utf8')
  const inCode = src.match(/process\.env\.SESSION_SECRET\s*\|\|\s*'([^']+)'/)?.[1]
  const fallback = inCode || historicalSecret()
  ev(`hard-coded fallback in current code: ${!!inCode}; a default secret exists in git history: ${!!historicalSecret()}`)
  if (!fallback) return
  const payload = Buffer.from(J({ userId: me.id, email: me.email, name: null, exp: Date.now() + 3600_000 })).toString('base64url')
  const sig = crypto.createHmac('sha256', fallback).update(payload).digest('base64url')
  const forged = await req('GET', '/api/auth/me', { cookie: `trueread_session=${payload}.${sig}` })
  ev(`token signed with that known default secret → GET /api/auth/me: HTTP ${forged.status}, user=${J(forged.json?.user?.email ?? null)}`)
  if (forged.json?.user) return { fail: 'A token signed with the hard-coded fallback secret was accepted. If SESSION_SECRET is not set in production, anyone who knows a user id can impersonate that user.' }
})

await test('S23', 'High', 'Auth module fails closed in production when SESSION_SECRET is missing or weak', async (ev) => {
  const authUrl = new URL('file:///' + path.join(REPO, 'src/lib/auth.ts').replace(/\\/g, '/')).href
  const script = `
    const a = await import(${J(authUrl)});
    const out = {};
    const mk = () => { try { return a.createSessionToken({ userId: 'u1', email: 'a@b.c' }) } catch (e) { return 'THROWS: ' + e.message } };
    const t = mk();
    out.sign = t.startsWith('THROWS') ? t : 'signed';
    out.verifyGarbage = a.verifySessionToken('x.y');
    out.verifyOldStyle = t.startsWith('THROWS') ? null : a.verifySessionToken(t) && 'valid';
    console.log(JSON.stringify(out));`
  const run = (env) => {
    try {
      return JSON.parse(
        execFileSync(process.execPath, ['--no-warnings', '--experimental-strip-types', '--input-type=module', '-e', script], {
          env: { ...process.env, SESSION_SECRET: '', ...env },
          stdio: ['ignore', 'pipe', 'pipe'],
        })
          .toString()
          .trim()
          .split('\n')
          .pop(),
      )
    } catch (e) {
      return { error: String(e.stderr || e.message).slice(0, 200) }
    }
  }
  const none = run({ NODE_ENV: 'production' })
  const weak = run({ NODE_ENV: 'production', SESSION_SECRET: 'short' })
  const good = run({ NODE_ENV: 'production', SESSION_SECRET: crypto.randomBytes(32).toString('hex') })
  ev(`production, no SESSION_SECRET → ${J(none)}`)
  ev(`production, 5-char SESSION_SECRET → ${J(weak)}`)
  ev(`production, 64-char SESSION_SECRET → ${J(good)}`)
  if (!/THROWS/.test(none.sign || '')) return { fail: 'Signing still works in production without a secret.' }
  if (!/THROWS/.test(weak.sign || '')) return { fail: 'A weak (short) secret is accepted.' }
  if (good.sign !== 'signed' || good.verifyOldStyle !== 'valid') return { fail: 'A proper secret no longer works (round trip failed).' }
})

await test('S02', 'Medium', 'Tampered session tokens are rejected', async (ev) => {
  const [data, sig] = decodeURIComponent(session.split('=')[1]).split('.')
  const p = JSON.parse(Buffer.from(data, 'base64url').toString())
  const tampered = Buffer.from(J({ ...p, userId: 'someone-else' })).toString('base64url')
  const a = await req('GET', '/api/auth/me', { cookie: `trueread_session=${tampered}.${sig}` })
  const b = await req('GET', '/api/auth/me', { cookie: `trueread_session=${data}.AAAA` })
  const c = await req('GET', '/api/auth/me', { cookie: `trueread_session=garbage` })
  ev(`changed userId, kept signature → user=${J(a.json?.user)}; bad signature → user=${J(b.json?.user)}; garbage → user=${J(c.json?.user)}`)
  if (a.json?.user || b.json?.user || c.json?.user) return { fail: 'A modified or invalid token was accepted.' }
})

await test('S03', 'Low', 'Session cookie flags (HttpOnly, SameSite, Secure in production)', async (ev) => {
  const login = await req('POST', '/api/auth/login', { body: { email, password } })
  const c = login.setCookie.find((x) => x.startsWith('trueread_session=')) || ''
  ev(`Set-Cookie flags: ${c.replace(/^[^;]+/, '<token>')}`)
  const src = fs.readFileSync(path.join(REPO, 'src/app/api/auth/login/route.ts'), 'utf8')
  ev(`Secure flag set from code: ${/secure:\s*process\.env\.NODE_ENV === 'production'/.test(src)}`)
  if (!/httponly/i.test(c)) return { fail: 'Cookie is not HttpOnly.' }
  if (!/samesite=lax/i.test(c)) return { fail: 'Cookie is not SameSite=Lax.' }
  if (!/secure:\s*process\.env\.NODE_ENV === 'production'/.test(src)) return { fail: 'Secure flag is not enabled for production.' }
})

await test('S04', 'Medium', 'Password policy: weak passwords are refused', async (ev) => {
  const r = await req('POST', '/api/auth/signup', { body: { email: `uat-weak-${rid}@example.test`, password: 'abcd' } })
  ev(`signup with password "abcd" → HTTP ${r.status}`)
  if (r.status === 200) return { fail: 'A 4-character password was accepted (policy minimum is 4; no complexity or breached-password check).' }
})

await test('S05', 'Medium', 'Login is rate-limited against password guessing', async (ev) => {
  const codes = {}
  const t0 = Date.now()
  for (let i = 0; i < 40; i++) {
    const r = await req('POST', '/api/auth/login', { body: { email, password: `wrong-${i}` } })
    codes[r.status] = (codes[r.status] || 0) + 1
  }
  ev(`40 wrong passwords for one account in ${Date.now() - t0} ms → status counts ${J(codes)}`)
  if (!codes[429]) return { fail: 'No request was throttled or blocked (no 429, no lockout). Passwords can be guessed at the server speed.' }
})

await test('S06', 'Low', 'Account enumeration: signup vs login reveal whether an email exists', async (ev) => {
  const dup = await req('POST', '/api/auth/signup', { body: { email, password: 'whatever-123' } })
  const miss = await req('POST', '/api/auth/login', { body: { email: `nobody-${rid}@example.test`, password: 'x' } })
  const bad = await req('POST', '/api/auth/login', { body: { email, password: 'x' } })
  ev(`signup existing email → ${dup.status} ${J(dup.json?.error)}; login unknown email → ${miss.status} ${J(miss.json?.error)}; login wrong password → ${bad.status} ${J(bad.json?.error)}`)
  if (dup.status === 409) return { fail: 'Signup answers "account already exists" (409), so anyone can test whether an email is registered. Login itself is generic (good).' }
})

await test('S07', 'Low', 'Malformed login input does not crash or leak (type-confusion / ORM operators)', async (ev) => {
  const a = await req('POST', '/api/auth/login', { body: { email: { contains: '' }, password: 'x' } })
  const b = await req('POST', '/api/auth/login', { raw: '{not json', headers: { 'content-type': 'application/json' } })
  const c = await req('POST', '/api/auth/login', { body: { email: "' OR 1=1 --", password: "' OR '1'='1" } })
  ev(`email as object → ${a.status}; broken JSON → ${b.status} body=${J(b.text.slice(0, 80))}; SQL-style strings → ${c.status}`)
  const leak = [a, b, c].some((r) => /at .*\(.*:\d+:\d+\)|prisma|SQLITE|node_modules/i.test(r.text))
  ev(`stack traces or driver text in any response: ${leak}`)
  if (leak || [a, b, c].some((r) => r.status === 200)) return { fail: 'Unexpected success or internal detail in the response.' }
})

await test('S08', 'Low', 'Mass assignment: extra fields on signup are ignored', async (ev) => {
  const r = await req('POST', '/api/auth/signup', { body: { email: `uat-mass-${rid}@example.test`, password: 'Str0ng-pass-1', id: 'attacker-chosen-id', role: 'admin', isAdmin: true } })
  ev(`signup with id/role/isAdmin → HTTP ${r.status}, returned user id=${J(r.json?.user?.id)}`)
  if (r.json?.user?.id === 'attacker-chosen-id') return { fail: 'Client-supplied id was used.' }
})

// ── B. Authorization & data exposure ───────────────────────────────────────
const BOOK = 'uat-book-' + rid
await test('S09', 'High', 'Writing feedback requires a valid session', async (ev) => {
  const a = await req('POST', `/api/books/${BOOK}/feedback`, { body: { pacing: 3, tone: 3, dialogue: 3 } })
  const b = await req('POST', `/api/books/${BOOK}/feedback`, { body: { pacing: 3, tone: 3, dialogue: 3 }, cookie: 'trueread_session=forged.value' })
  ev(`no cookie → ${a.status}; forged cookie → ${b.status}`)
  if (a.status !== 401 || b.status !== 401) return { fail: 'Feedback could be written without a valid session.' }
})

await test('S10', 'Medium', 'Feedback input validation (ratings, length, odd ids) and injection strings', async (ev) => {
  const bad = []
  for (const v of [0, 6, -1, 'abc', null, 99999]) {
    const r = await req('POST', `/api/books/${BOOK}/feedback`, { body: { pacing: v, tone: 3, dialogue: 3 }, cookie: session })
    bad.push(`${J(v)}→${r.status}`)
  }
  ev(`out-of-range ratings: ${bad.join(', ')}`)
  const long = await req('POST', `/api/books/${BOOK}/feedback`, { body: { pacing: 3, tone: 3, dialogue: 3, note: 'x'.repeat(5000) }, cookie: session })
  ev(`5000-char note → ${long.status}, stored length=${long.json?.feedback?.note?.length}`)
  const sqli = await req('GET', `/api/books/${encodeURIComponent("x' OR '1'='1")}/feedback`)
  ev(`book id "x' OR '1'='1" → ${sqli.status}, count=${sqli.json?.count}`)
  const xss = await req('POST', `/api/books/${BOOK}/feedback`, { body: { pacing: 3, tone: 3, dialogue: 3, note: '<script>alert(1)</script><img src=x onerror=alert(2)>' }, cookie: session })
  const back = await req('GET', `/api/books/${BOOK}/feedback`)
  ev(`XSS note stored; GET returns content-type=${back.headers.get('content-type')}, nosniff=${back.headers.get('x-content-type-options')}`)
  if (bad.some((s) => /→200/.test(s)) || (long.json?.feedback?.note?.length ?? 0) > 500 || sqli.status >= 500) return { fail: 'Validation gap.' }
  if (!/application\/json/.test(back.headers.get('content-type') || '')) return { fail: 'Feedback JSON is not served as application/json.' }
})

await test('S11', 'Medium', "Public feedback listing does not expose users' email addresses", async (ev) => {
  const r = await req('GET', `/api/books/${BOOK}/feedback`)
  const author = r.json?.feedbacks?.[0]?.authorName
  const local = email.split('@')[0]
  ev(`account has no display name; authorName returned publicly = ${J(author)} (email local-part is ${J(local)})`)
  ev(`anyone (no login) can read this: HTTP ${r.status}`)
  if (author === local) return { fail: 'When a user has no display name, the public API returns the part of their email before the @ as the author name.' }
})

await test('S12', 'Medium', 'Reviews endpoint does not invent reviews or attribute them to real brands', async (ev) => {
  const r = await req('GET', `/api/books/anybook/fetched-reviews?title=${encodeURIComponent('<b>x</b>')}`)
  const q = r.json?.extractedQuotes ?? []
  ev(`returns ${q.length} "reviews", e.g. reviewer=${J(q[0]?.reviewer)}, source=${J(q[0]?.sourceName)}; source label=${J(r.json?.source)}`)
  ev(`numbers are derived from a hash of the book id (deterministic), not from real reviews`)
  const used = sh(`git grep -n "fetched-reviews" -- src ":!src/app/api"`).trim() || '(not referenced by the UI)'
  ev(`UI references: ${used.split('\n')[0]}`)
  if (q.length) return { fail: 'The endpoint fabricates review quotes attributed to "Goodreads Verified" / "Amazon Editorial" etc. The site promises it never fabricates reviews; remove the endpoint or make it return real data only.' }
})

// ── C. Public API robustness ───────────────────────────────────────────────
await test('S13', 'Low', 'Search API clamps its parameters and survives hostile input', async (ev) => {
  const a = await req('GET', '/api/books/search?q=fantasy&maxResults=100000&startIndex=-50')
  ev(`maxResults=100000, startIndex=-50 → ${a.status}, returned=${a.json?.results?.length}, echoed maxResults=${a.json?.maxResults}, startIndex=${a.json?.startIndex}`)
  const b = await req('GET', '/api/books/search?q=')
  const c = await req('GET', `/api/books/search?q=${encodeURIComponent("'; DROP TABLE users; --")}`)
  ev(`empty q → ${b.status}; SQL-style q → ${c.status}`)
  if ((a.json?.maxResults ?? 0) > 40 || b.status !== 400) return { fail: 'Parameter clamping or validation is missing.' }
})

await test('S14', 'Low', 'Search caps query length and does not echo internal error text', async (ev) => {
  // Node itself rejects URLs above ~16 KB (HTTP 431), so probe below that: 8,000 characters.
  const huge = await req('GET', `/api/books/search?q=${'a'.repeat(60_000)}`)
  ev(`60,000-char URL → HTTP ${huge.status} (rejected by the Node server itself — good)`)
  const q = 'a'.repeat(8000)
  const r = await req('GET', `/api/books/search?q=${q}`)
  ev(`8,000-char query → HTTP ${r.status} in ${r.ms} ms; has "detail" field: ${'detail' in (r.json || {})}`)
  if (r.json?.detail) ev(`detail text returned to the client: ${J(String(r.json.detail).slice(0, 140))}`)
  const src = fs.readFileSync(path.join(REPO, 'src/app/api/books/search/route.ts'), 'utf8')
  const leaks = /detail:\s*String\(/.test(src)
  ev(`route code returns the caught error message to the client (detail: String(err.message)): ${leaks}`)
  if (r.status === 200 || r.status >= 500) return { fail: `No application-level cap on query length (an 8,000-character query was forwarded upstream, HTTP ${r.status}). Also, failures return the internal error text in "detail".` }
})

await test('S15', 'Medium', 'Search is rate-limited (protects the upstream Google/Apple quota)', async (ev) => {
  const codes = {}
  const t0 = Date.now()
  await Promise.all(Array.from({ length: 30 }, (_, i) => req('GET', `/api/books/search?q=probe${i}`).then((r) => (codes[r.status] = (codes[r.status] || 0) + 1))))
  ev(`30 parallel searches in ${Date.now() - t0} ms → ${J(codes)}`)
  if (!codes[429]) return { fail: 'No throttling. The code comments note that Google already rate-limits (HTTP 429) this app, so a script can exhaust the quota for every user.' }
})

await test('S16', 'Low', 'Enrich endpoint: bad input rejected, ISBN is sanitised, no SSRF via book fields', async (ev) => {
  const a = await req('POST', '/api/books/x/enrich', { body: {} })
  const b = await req('POST', '/api/books/x/enrich', { body: { book: { id: 'x', title: 't', authors: [], year: null, isbn13: '../../etc/passwd?x=1#', previewLink: 'http://169.254.169.254/latest/meta-data/' } } })
  ev(`empty body → ${a.status}; hostile isbn13 + metadata-service previewLink → ${b.status} in ${b.ms} ms`)
  const src = fs.readFileSync(path.join(REPO, 'src/lib/providers/open-library-provider.ts'), 'utf8')
  ev(`ISBN cleaned with .replace(/[^0-9X]/gi,'') before building the URL: ${/replace\(\/\[\^0-9X\]\/gi/.test(src)}`)
  ev(`outbound hosts in provider code: ${[...new Set([...fs.readFileSync(path.join(REPO, 'src/lib/providers/index.ts'), 'utf8').matchAll(/https?:\/\/[a-z.]+/g)].map((m) => m[0]))].join(', ') || '(fixed hosts only)'}`)
  if (a.status !== 400) return { fail: 'Empty request not rejected with 400.' }
})

await test('S17', 'Low', 'Oversized request bodies are limited', async (ev) => {
  const big = 'x'.repeat(6 * 1024 * 1024)
  const r = await req('POST', '/api/books/x/enrich', { body: { book: { id: 'x', title: big } } })
  ev(`6 MB JSON body → HTTP ${r.status} in ${r.ms} ms`)
  if (r.status < 400) return { fail: 'A 6 MB body was accepted and processed; there is no size limit on API routes.' }
})

// ── D. Transport, headers, exposure ────────────────────────────────────────
await test('S18', 'Medium', 'Security response headers', async (ev) => {
  const r = await req('GET', '/')
  const h = (n) => r.headers.get(n)
  const want = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
  }
  for (const [k, v] of Object.entries(want)) ev(`${k}: ${J(h(k))} ${h(k)?.toLowerCase() === v.toLowerCase() ? '✔' : '✘ expected ' + v}`)
  const missing = ['content-security-policy', 'strict-transport-security', 'permissions-policy'].filter((k) => !h(k))
  ev(`missing: ${missing.join(', ') || 'none'}`)
  ev('note: Strict-Transport-Security is normally added by Vercel on HTTPS; verify on the deployed site.')
  if (!h('content-security-policy')) return { fail: 'No Content-Security-Policy header. A CSP is the main safety net if any XSS slips in.' }
})

await test('S19', 'Low', 'Cross-origin: no permissive CORS on API routes', async (ev) => {
  const r = await req('GET', '/api/books/search?q=dune', { headers: { origin: 'https://evil.example' } })
  const o = await req('OPTIONS', '/api/books/search', { headers: { origin: 'https://evil.example', 'access-control-request-method': 'GET' } })
  ev(`Access-Control-Allow-Origin on GET: ${J(r.headers.get('access-control-allow-origin'))}; on preflight: ${J(o.headers.get('access-control-allow-origin'))}`)
  if (r.headers.get('access-control-allow-origin') === '*' || o.headers.get('access-control-allow-origin') === 'https://evil.example') return { fail: 'Cross-origin access is allowed.' }
})

await test('S20', 'High', 'Source, secrets and database are not downloadable from the web server', async (ev) => {
  const paths = ['/.env', '/.git/config', '/.git/HEAD', '/db/custom.db', '/prisma/schema.prisma', '/package.json', '/bun.lock', '/src/lib/auth.ts', '/Caddyfile', '/.vercel/project.json', '/..%2f..%2f.env', '/api/../.env']
  const hits = []
  for (const p of paths) {
    const r = await req('GET', p)
    ev(`GET ${p} → ${r.status}`)
    if (r.status === 200 && !/<html/i.test(r.text.slice(0, 200))) hits.push(p)
  }
  if (hits.length) return { fail: `Readable: ${hits.join(', ')}` }
})

// ── E. Repository hygiene ──────────────────────────────────────────────────
await test('S21', 'High', 'Secrets and databases are not committed to git', async (ev) => {
  const tracked = sh('git ls-files').split('\n')
  // `.env.example` is meant to be committed (placeholders only), so it is excluded.
  const bad = tracked.filter((f) => (/^\.env($|\.)/.test(f) && f !== '.env.example') || /\.(db|sqlite|pem|key|p12)$/i.test(f) || /^db\//.test(f))
  ev(`tracked sensitive-looking files: ${bad.join(', ') || 'none'}`)
  const inHistory = sh('git log --all --oneline -- .env db/custom.db').trim().split('\n').filter(Boolean)
  ev(`commits that touched them: ${inHistory.length} (e.g. ${inHistory[0] || '-'})`)
  const gi = fs.readFileSync(path.join(REPO, '.gitignore'), 'utf8')
  ev(`.gitignore lists .env*: ${/^\.env\*/m.test(gi)} — but ignore rules do not apply to files that were already committed`)
  const envKeys = fs.readFileSync(path.join(REPO, '.env'), 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => l.split('=')[0])
  ev(`variable names in the committed .env (values not shown): ${envKeys.join(', ')}`)
  if (bad.length) return { fail: `Committed: ${bad.join(', ')}. They stay in git history even after deletion.` }
})

await test('S22', 'High', 'No hard-coded secret fallback in source', async (ev) => {
  const hits = fs.readFileSync(path.join(REPO, 'src/lib/auth.ts'), 'utf8').split('\n').filter((l) => /\|\|\s*'[^']{12,}'/.test(l)).join('\n')
  ev(`working-tree src/lib/auth.ts lines with a long string fallback: ${hits ? hits.replace(/'[^']+'/, "'<redacted>'") : 'none'}`)
  ev('NOTE: the old default secret remains in git history. If the deployed site never had SESSION_SECRET set, rotate it (set one now) — setting it invalidates every token signed with the old default.')
  if (hits) return { fail: 'A default signing secret is committed to the repository and used whenever SESSION_SECRET is unset. Fail closed instead (throw at start-up) and rotate any deployed secret.' }
})

fs.writeFileSync(path.join(OUT, 'security.json'), JSON.stringify({ base: BASE, when: new Date().toISOString(), results }, null, 2))
const f = results.filter((r) => r.status === 'FINDING')
console.log(`\n${results.length - f.length - results.filter((r) => r.status === 'ERROR').length} passed, ${f.length} findings, ${results.filter((r) => r.status === 'ERROR').length} errors`)
process.exit(0)
