/**
 * True2Readers — UAT end-to-end suite (Classic + Shelf).
 *
 * Drives a real Chromium through the user journeys and asserts on what the
 * page actually shows. Every test records its steps ("expected → actual") and
 * screenshots, written to EVIDENCE_DIR/e2e.json for the report.
 *
 * Run (app already running on BASE_URL):
 *   npm i --no-save playwright-core
 *   CHROME_PATH="C:/.../chrome.exe" EVIDENCE_DIR=./uat-evidence node tests/e2e/uat-e2e.mjs
 *
 * Needs outbound internet (the app queries Apple Books / Google Books /
 * Open Library). Uses fresh browser contexts, so it never touches real data.
 */
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:3001'
// 'off' = the shipping build (accounts disabled, the default); 'on' = a build made with
// NEXT_PUBLIC_AUTH_ENABLED=true (regression check for the parked accounts code).
const AUTH_MODE = process.env.AUTH_MODE || 'off'
const OUT = process.env.EVIDENCE_DIR || './uat-evidence'
const CHROME = process.env.CHROME_PATH
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const records = []
let cur
let shotN = 0

async function shot(page, label) {
  const file = `shots/${String(++shotN).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.jpg`
  await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 72 })
  cur.shots.push({ file, label })
}
const note = (m) => cur.steps.push(m)
function check(label, actual, ok, expectedText) {
  const pass = typeof ok === 'function' ? ok(actual) : actual === ok
  cur.steps.push(`${pass ? 'PASS' : 'FAIL'} — ${label}: expected ${expectedText ?? JSON.stringify(ok)}; actual ${JSON.stringify(actual)}`)
  if (!pass) throw new Error(`${label}: expected ${expectedText ?? JSON.stringify(ok)}, got ${JSON.stringify(actual)}`)
}

async function test(id, title, fn) {
  cur = { id, title, status: 'PASS', steps: [], shots: [], ms: 0 }
  const t0 = Date.now()
  let page
  try {
    page = await fn()
  } catch (e) {
    cur.status = 'FAIL'
    cur.error = String(e.message || e)
  }
  cur.ms = Date.now() - t0
  records.push(cur)
  console.log(`${cur.status === 'PASS' ? '✔' : '✘'} ${id} ${title} (${cur.ms} ms)${cur.error ? '\n    ' + cur.error : ''}`)
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true })

async function openApp({ mobile = false, routes } = {}) {
  const ctx = await browser.newContext(
    mobile
      ? { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }
      : { viewport: { width: 1280, height: 800 } },
  )
  const page = await ctx.newPage()
  page.errors = []
  page.dialogs = []
  page.csp = [] // Content-Security-Policy violations the browser reports
  page.reqs = [] // every URL the page requested (to prove what the browser does and does not call)
  page.on('request', (r) => page.reqs.push(r.url()))
  page.on('pageerror', (e) => page.errors.push(String(e)))
  page.on('console', (m) => {
    if (/content security policy/i.test(m.text())) page.csp.push(m.text().slice(0, 220))
  })
  page.on('dialog', (d) => {
    page.dialogs.push(d.message())
    d.dismiss().catch(() => {})
  })
  if (routes) await routes(page)
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.getByText('What are you in the mood to read?').waitFor({ timeout: 60000 })
  await sleep(600) // let hydration + localStorage hook settle
  return page
}
const setMode = (page, m) => page.locator('[aria-label="Browsing style"] button', { hasText: new RegExp(`^${m}$`, 'i') }).click()
const submitQuiz = async (page) => {
  await page.getByText('Show books that fit').click()
}
const shelfReady = async (page) => {
  await page.locator('[data-shelf] [data-shelf-item]').first().waitFor({ timeout: 30000 })
  await sleep(900)
}
const caption = (page) => page.locator('main h2').first().innerText()
const settle = async (page, title) => {
  await page.waitForFunction((t) => document.querySelector('main h2')?.textContent?.trim() === t, title, { timeout: 8000 })
  await sleep(700)
}

// ───────────────────────────────────────────────────────────────────────────
await test('E01', 'Home loads, quiz shown, Classic is the default view', async () => {
  const p = await openApp()
  check('page title', await p.title(), (t) => /True2Readers/.test(t), 'contains "True2Readers"')
  check('quiz heading visible', await p.getByText('What are you in the mood to read?').isVisible(), true)
  const pressed = await p.locator('[aria-label="Browsing style"] button[aria-pressed="true"]').innerText()
  check('default view', pressed.toLowerCase(), 'classic')
  check('uncaught page errors', p.errors.length, 0)
  const cspHeader = await p.evaluate(async () => (await fetch('/', { method: 'HEAD' })).headers.get('content-security-policy'))
  check('Content-Security-Policy is sent with the page', !!cspHeader, true)
  check('CSP violations reported by the browser', p.csp.length, 0)
  await shot(p, 'home-quiz-classic-default')
  await p.context().close()
})

await test('E02', 'Classic: quiz returns 10 picks; genre chips really filter', async () => {
  const p = await openApp()
  await submitQuiz(p)
  await p.getByText('Books that fit what you\'re looking for').waitFor()
  const names = () => p.locator('main h2').allInnerTexts()
  check('picks with "All"', (await names()).length, 10)
  await shot(p, 'classic-picks-all')
  for (const [genre, n] of [['Thriller', 2], ['Finance', 2], ['Fantasy', 1]]) {
    await p.getByRole('button', { name: genre, exact: true }).click()
    await sleep(700)
    check(`picks with "${genre}"`, (await names()).length, n)
  }
  await p.getByRole('button', { name: 'Thriller', exact: true }).click()
  await sleep(600)
  const t = await names()
  check('Thriller picks', t.sort(), (a) => a.join('|') === ['Gone Girl', 'The Silent Patient'].join('|'), '["Gone Girl","The Silent Patient"]')
  await shot(p, 'classic-filter-thriller')
  await p.context().close()
})

await test('E03', 'Shelf mode: choice persists across reload', async () => {
  const p = await openApp()
  await setMode(p, 'shelf')
  await sleep(500)
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.getByText('What are you in the mood to read?').waitFor()
  await sleep(800)
  const pressed = await p.locator('[aria-label="Browsing style"] button[aria-pressed="true"]').innerText()
  check('view after reload', pressed.toLowerCase(), 'shelf')
  check('stored value', await p.evaluate(() => localStorage.getItem('trueread:ui-mode:v1')), '"shelf"')
  await shot(p, 'shelf-choice-persisted')
  await p.context().close()
})

await test('E04', 'Shelf: first book is never blank — generated cover shows while the real image is slow', async () => {
  const p = await openApp({
    routes: async (page) => {
      // Simulate a slow network: every cover image is held for 5 s.
      await page.route(/covers\.openlibrary\.org|mzstatic\.com|books\.google/, async (route) => {
        await new Promise((r) => setTimeout(r, 5000))
        route.continue().catch(() => {})
      })
    },
  })
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  const t0 = Date.now()
  const faceText = await p.evaluate(() => {
    const el = document.querySelectorAll('[data-shelf] [data-shelf-item]')[0]?.parentElement?.children?.[1]
    return el ? el.innerText.replace(/\s+/g, ' ').trim() : ''
  })
  note(`checked at ~${Date.now() - t0} ms after the shelf appeared, with images still held back`)
  check('centre cover shows text (not blank)', faceText, (s) => /Atomic Habits/.test(s) && /James Clear/.test(s), 'contains "Atomic Habits" and "James Clear"')
  await shot(p, 'shelf-first-book-images-delayed')
  // Open Library can be slow (it redirects to archive.org), so allow up to 40 s
  // and report how long the real image actually took.
  const t1 = Date.now()
  await p
    .waitForFunction(() => {
      const img = document.querySelectorAll('[data-shelf] [data-shelf-item]')[0]?.parentElement?.children?.[1]?.querySelector('img')
      return !!img && img.complete && img.naturalWidth > 0 && img.style.opacity === '1'
    }, null, { timeout: 40000 })
    .catch(() => {})
  const op = await p.evaluate(() => {
    const img = document.querySelectorAll('[data-shelf] [data-shelf-item]')[0]?.parentElement?.children?.[1]?.querySelector('img')
    return img ? { done: img.complete && img.naturalWidth > 0, opacity: img.style.opacity } : null
  })
  note(`real image finished loading ~${Math.round((Date.now() - t1) / 1000)} s after the check (5 s of it was the artificial hold)`)
  check('real image fades in once loaded', op, (o) => o && o.done && o.opacity === '1', '{done:true, opacity:"1"}')
  await shot(p, 'shelf-first-book-after-image-loads')
  await p.context().close()
})

await test('E05', 'Shelf: 15 curated picks, navigate with keys, long titles fit on spines', async () => {
  const p = await openApp()
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  check('books on shelf', await p.locator('[data-shelf] [data-shelf-item]').count(), 15)
  check('first caption', await caption(p), 'Atomic Habits')
  await shot(p, 'shelf-quiz-picks')
  for (let i = 0; i < 7; i++) {
    await p.keyboard.press('ArrowRight')
    await sleep(120)
  }
  await settle(p, 'Sapiens: A Brief History of Humankind')
  check('caption after 7 × →', await caption(p), 'Sapiens: A Brief History of Humankind')
  const pos = await p.locator('main p', { hasText: /\d+ \/ \d+/ }).first().innerText()
  check('position indicator', pos, (s) => /^8 \/ 15/.test(s), 'starts with "8 / 15"')
  const spine = await p.evaluate(() => {
    const o = [...document.querySelectorAll('[data-shelf-item]')].find((e) => e.getAttribute('aria-label')?.startsWith('Sapiens'))
    return o ? o.innerText.replace(/\s+/g, ' ').trim() : ''
  })
  check('spine text is the short title', spine, (s) => /SAPIENS/.test(s) && !/HUMANKIND/i.test(s), 'contains SAPIENS, not the subtitle')
  const overflow = await p.evaluate(() => {
    const o = [...document.querySelectorAll('[data-shelf-item]')].find((e) => e.getAttribute('aria-label')?.startsWith('Harry Potter'))
    const t = o?.querySelector('div > div:nth-child(2), div > div:last-child')
    return o ? { sw: o.scrollWidth <= o.clientWidth + 1, sh: o.scrollHeight <= o.clientHeight + 1 } : null
  })
  check('Harry Potter spine content stays inside the spine', overflow, (o) => o && o.sw && o.sh, '{sw:true, sh:true}')
  await shot(p, 'shelf-sapiens-centred-long-title-spines')
  await p.keyboard.press('ArrowLeft')
  await settle(p, 'Harry Potter and the Sorcerer\'s Stone')
  check('← moves back one book', await caption(p), 'Harry Potter and the Sorcerer\'s Stone')
  await p.context().close()
})

await test('E06', 'Shelf: save / unsave from the shelf, count updates, survives reload', async () => {
  const p = await openApp()
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  const count = async () => (await p.locator('[aria-label^="Saved books"]').getAttribute('aria-label')).replace('Saved books: ', '')
  check('saved count before', await count(), '0')
  await p.getByRole('button', { name: 'Save this book' }).click()
  await sleep(500)
  check('saved count after Save', await count(), '1')
  check('button now says Saved', await p.getByRole('button', { name: 'Remove from saved books' }).isVisible(), true)
  await shot(p, 'shelf-saved-1')
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.getByText('What are you in the mood to read?').waitFor()
  await sleep(900)
  check('saved count after reload', await count(), '1')
  await submitQuiz(p)
  await shelfReady(p)
  await p.getByRole('button', { name: 'Remove from saved books' }).click()
  await sleep(500)
  check('saved count after Unsave', await count(), '0')
  await p.context().close()
})

await test('E07', 'Shelf → book page: preview first, reader experience next, no invented data, Back restores position', async () => {
  const p = await openApp()
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  for (let i = 0; i < 7; i++) {
    await p.keyboard.press('ArrowRight')
    await sleep(120)
  }
  await settle(p, 'Sapiens: A Brief History of Humankind')
  await p.getByRole('button', { name: /^Open book$/i }).click()
  await p.locator('h1').waitFor({ timeout: 15000 })
  await sleep(1500)
  check('book page h1', await p.locator('h1').innerText(), 'Sapiens: A Brief History of Humankind')
  check('exactly one h1', await p.locator('h1').count(), 1)
  const heads = (await p.locator('h2').allInnerTexts()).map((s) => s.toLowerCase())
  const iPrev = heads.findIndex((h) => /^preview/.test(h))
  const iExp = heads.findIndex((h) => /what readers experience/.test(h))
  note(`section order: ${JSON.stringify(heads)}`)
  check('Preview section exists', iPrev >= 0, true)
  check('Preview comes before "What readers experience"', iPrev < iExp, true)
  const body = await p.locator('body').innerText()
  check('no placeholder ISBN / page count', /978-0735211292|~320 pages|Management & Leadership/.test(body), false)
  check('real ISBN shown', /9780062316110/.test(body), true)
  check('Save button is visible on the book page', await p.getByRole('button', { name: /^Save$/i }).isVisible(), true)
  check('hidden-for-now items are not shown (Print / Share / Enlarge)', /\bPrint\b|Enlarge cover/.test(await p.locator('main').innerText()), false)
  await shot(p, 'shelf-book-page-sapiens')
  await p.getByRole('button', { name: /Back to your picks/i }).click()
  await p.locator('[data-shelf]').waitFor({ timeout: 15000 })
  await sleep(1500)
  check('Back returns to the shelf at the same book', await caption(p), 'Sapiens: A Brief History of Humankind')
  await shot(p, 'shelf-back-from-book-same-position')
  await p.context().close()
})

await test('E08', 'Opening animation: cover swings open, page grows to full screen, then hands over', async () => {
  const p = await openApp()
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  await p.getByRole('button', { name: 'Book swing' }).click() // the original opening, chosen by the reader
  const samples = await p.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const btn = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().toLowerCase() === 'open book')
    const t0 = performance.now()
    btn.click()
    const out = []
    for (let i = 0; i < 20; i++) {
      await sleep(40)
      const w = [...document.body.children].find((c) => c.matches?.('div.fixed.z-\\[100\\]'))
      if (!w) {
        out.push({ t: Math.round(performance.now() - t0), gone: true })
        continue
      }
      const [sheet, cover] = w.children
      const r = sheet.getBoundingClientRect()
      const m = new DOMMatrix(getComputedStyle(cover).transform)
      out.push({ t: Math.round(performance.now() - t0), w: Math.round(r.width), h: Math.round(r.height), rot: Math.round((Math.atan2(m.m13, m.m11) * 180) / Math.PI), radius: getComputedStyle(sheet).borderRadius })
    }
    return out
  })
  const live = samples.filter((s) => !s.gone)
  note(`samples: ${JSON.stringify(live.map((s) => `${s.t}ms ${s.w}x${s.h} rot=${s.rot}`))}`)
  check('starts at cover size (< 400px wide)', live[0].w, (w) => w < 400, '< 400')
  check('grows to the full viewport width (1280)', Math.max(...live.map((s) => s.w)), (w) => w >= 1270, '≥ 1270')
  check('cover hinges open (> 90°)', Math.max(...live.map((s) => Math.abs(s.rot))), (r) => r > 90, '> 90°')
  check('square corners (no radius on the page panel)', live.every((s) => s.radius === '0px'), true)
  check('overlay removed afterwards', samples.some((s) => s.gone), true)
  await p.locator('h1').waitFor({ timeout: 15000 })
  check('book page is showing', (await p.locator('h1').innerText()).length > 0, true)
  await shot(p, 'after-open-animation-book-page')
  await p.context().close()
})

await test('E09', 'Shelf search: 24 real results, paging, no raw HTML, open a result', async () => {
  const p = await openApp()
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  await p.getByPlaceholder('Search a title or author…').fill('fantasy')
  await p.keyboard.press('Enter')
  await p.getByRole('heading', { name: /Results for/ }).waitFor({ timeout: 45000 })
  await shelfReady(p)
  check('books on the shelf', await p.locator('[data-shelf] [data-shelf-item]').count(), 24)
  const sub = await p.locator('main p').first().innerText().catch(() => '')
  note(`results header text: ${await p.getByRole('heading', { name: /Results for/ }).innerText()}`)
  await shot(p, 'shelf-search-fantasy')
  check('pager shows', await p.getByRole('button', { name: /Next 24/ }).isVisible(), true)
  await p.getByRole('button', { name: /Next 24/ }).click()
  // The pager is upper-cased by CSS, so innerText is "PAGE 2 OF 3".
  await p.waitForFunction(() => /Page 2 of/i.test(document.body.innerText), null, { timeout: 45000 })
  await sleep(1200)
  note(`pager on page 2: ${(await p.locator('body').innerText()).match(/Page 2 of \d+/i)?.[0]}`)
  check('page 2 reached', /Page 2 of/i.test(await p.locator('body').innerText()), true)
  await p.getByRole('button', { name: /^Open book$/i }).click()
  await p.locator('h1').waitFor({ timeout: 20000 })
  await sleep(1500)
  const txt = await p.locator('main').innerText()
  check('no raw HTML tags in the book text', /<\/?(b|i|br|p|em|strong)\b[^>]*>/i.test(txt), false)
  check('no CSP violations on search results (covers from Apple/Google/Open Library)', p.csp.length, 0)
  await shot(p, 'shelf-search-result-book-page')
  await p.context().close()
})

await test('E10', 'Search safety: no-results message; script/HTML typed into search is shown as text, never run', async () => {
  const p = await openApp()
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  const payload = '<img src=x onerror=alert(document.domain)><script>alert(1)</script>'
  await p.getByPlaceholder('Search a title or author…').fill(payload)
  await p.keyboard.press('Enter')
  await p.getByRole('heading', { name: /Results for/ }).waitFor({ timeout: 45000 })
  await sleep(1500)
  const h = await p.getByRole('heading', { name: /Results for/ }).innerText()
  check('payload is rendered as literal text', h.includes('<img src=x'), true)
  check('no injected <img src=x> element', await p.locator('img[src="x"]').count(), 0)
  check('no dialog fired (no script ran)', p.dialogs.length, 0)
  check('empty-state message shown', /No books to show/.test(await p.locator('main').innerText()), true)
  await shot(p, 'search-xss-payload-rendered-as-text')
  await p.context().close()
})

await test('E11', 'Classic view still works: results, book page (Save + label), Esc closes shortcuts', async () => {
  const p = await openApp()
  await submitQuiz(p)
  await p.getByText('Books that fit what you\'re looking for').waitFor()
  await p.getByText('View book experience').first().click()
  await p.locator('h1').waitFor({ timeout: 20000 })
  await sleep(1200)
  check('classic book page has "Reader Experience Framework"', /reader experience framework/i.test(await p.locator('body').innerText()), true)
  check('classic book page has a Save button', await p.getByRole('button', { name: /^Save$/i }).first().isVisible(), true)
  check('back label is the real one', await p.getByRole('button', { name: /Back to your picks/ }).isVisible(), true)
  await shot(p, 'classic-book-page')
  await p.getByRole('button', { name: 'Show keyboard shortcuts' }).click()
  await p.getByText('Press Esc to close').waitFor()
  await shot(p, 'classic-shortcuts-open')
  await p.keyboard.press('Escape')
  await sleep(600)
  check('shortcuts dialog closes on Esc', await p.getByText('Press Esc to close').count(), 0)
  await p.context().close()
})

await test('E12', 'Same data in both views: switch Classic ↔ Shelf on a book page', async () => {
  const p = await openApp()
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  await p.getByRole('button', { name: /^Open book$/i }).click()
  await p.locator('h1').waitFor({ timeout: 20000 })
  await sleep(1200)
  const hasFramework = async () => /reader experience framework/i.test(await p.locator('body').innerText())
  check('Shelf book page hides the framework block', await hasFramework(), false)
  await setMode(p, 'classic')
  await sleep(1500)
  check('Classic book page shows it again', await hasFramework(), true)
  check('same book either way', await p.locator('h1').innerText(), 'Atomic Habits')
  await shot(p, 'switched-to-classic-on-book-page')
  await p.context().close()
})

await test('E13', AUTH_MODE === 'on' ? 'Sign-in dialog branding and basic validation (no account is created)' : 'Accounts off: no Sign In button, and the Privacy page is accurate', async () => {
  const p = await openApp()
  if (AUTH_MODE !== 'on') {
    // Shipping build: there are no accounts. Nothing to sign in to, and the Privacy page says so truthfully.
    check('no Sign In button in the header', await p.getByRole('button', { name: 'Sign In' }).count(), 0)
    await p.getByRole('button', { name: 'Open navigation menu' }).click()
    await p.getByText('Privacy', { exact: true }).first().click() // the dropdown entry (not a button)
    await p.getByText('has no accounts').waitFor({ timeout: 10000 })
    const dlg = await p.locator('[role=dialog]').innerText()
    check('Privacy says there are no accounts', /has no accounts/.test(dlg), true)
    check('Privacy names who receives search words and cover requests', /Google Books/.test(dlg) && /Open Library/.test(dlg) && /Vercel/.test(dlg), true)
    check('Privacy no longer claims accounts or session tokens', /encrypted session tokens|User accounts are authenticated/i.test(dlg), false)
    await shot(p, 'privacy-no-accounts')
    await p.context().close()
    return
  }
  await p.getByRole('button', { name: 'Sign In' }).click()
  await p.getByText(/Welcome back to/).waitFor()
  check('dialog title', await p.getByText(/Welcome back to/).innerText(), 'Welcome back to True2Readers')
  await shot(p, 'sign-in-dialog')
  await p.keyboard.press('Escape')
  await sleep(1200)
  check('dialog closes on Esc', await p.getByText(/Welcome back to/).count(), 0)
  await p.context().close()
})

await test('E14', 'Mobile (375×812): shelf fits one screen, controls reachable, swipe works, no sideways scroll', async () => {
  const p = await openApp({ mobile: true })
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, ih: innerHeight, openBottom: [...document.querySelectorAll('button')].find((b) => /open book/i.test(b.textContent))?.getBoundingClientRect().bottom }))
  check('no horizontal overflow', m.sw <= m.iw, true)
  check('"Open book" is inside the first screen', m.openBottom <= m.ih, true)
  await shot(p, 'mobile-shelf')
  const before = await caption(p)
  const box = await p.locator('[data-shelf]').boundingBox()
  await p.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2)
  await p.mouse.down()
  await p.mouse.move(box.x + box.width * 0.15, box.y + box.height / 2, { steps: 12 })
  await p.mouse.up()
  await sleep(1500)
  const after = await caption(p)
  check('swipe changed the book', after !== before, true)
  await shot(p, 'mobile-after-swipe')
  await p.getByRole('button', { name: /^Open book$/i }).click()
  await p.locator('h1').waitFor({ timeout: 20000 })
  await sleep(1200)
  check('mobile book page: no horizontal overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await shot(p, 'mobile-book-page')
  await p.context().close()
})

await test('E15', 'Keyboard & accessibility basics on the shelf', async () => {
  const p = await openApp()
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  const a = await p.evaluate(() => ({
    listbox: !!document.querySelector('[data-shelf][aria-label]'),
    options: document.querySelectorAll('[data-shelf-item][aria-label]').length,
    // Buttons inside aria-hidden regions (the decorative position ruler) are not exposed to assistive tech.
    unnamedButtons: [...document.querySelectorAll('button')].filter((b) => !b.closest('[aria-hidden="true"]') && !(b.getAttribute('aria-label') || b.textContent.trim())).length,
    imgsWithoutAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
    imgsWithoutSize: [...document.querySelectorAll('[data-shelf] img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
    lang: document.documentElement.lang,
  }))
  check('shelf is a labelled carousel group', a.listbox, true)
  check('every book is a labelled, focusable item', a.options, 15)
  check('buttons without a name', a.unnamedButtons, 0)
  check('images without alt', a.imgsWithoutAlt, 0)
  check('shelf images with explicit width/height (no layout shift)', a.imgsWithoutSize, 0)
  check('page language', a.lang, 'en')
  await p.keyboard.press('ArrowRight')
  await settle(p, 'The Silent Patient')
  await p.keyboard.press('Enter')
  // The shelf page has its own h1 ("Books that fit…"), so wait for the book's title.
  await p.locator('h1', { hasText: 'The Silent Patient' }).waitFor({ timeout: 20000 })
  check('Enter opens the centred book', await p.locator('h1').innerText(), 'The Silent Patient')
  await p.context().close()
})

await test('E16', 'Performance & stability on the shelf (indicative — dev server)', async () => {
  const p = await openApp()
  await p.addInitScript(() => {
    window.__cls = 0
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value })).observe({ type: 'layout-shift', buffered: true })
  })
  await p.reload({ waitUntil: 'load' })
  await p.getByText('What are you in the mood to read?').waitFor()
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  await sleep(2500)
  const perf = await p.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    const res = performance.getEntriesByType('resource')
    const imgs = res.filter((r) => r.initiatorType === 'img' || /\.(jpg|jpeg|png|webp)/i.test(r.name))
    return {
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
      loadMs: Math.round(nav.loadEventEnd),
      coverRequests: imgs.length,
      coverKB: Math.round(imgs.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
      cls: +(window.__cls || 0).toFixed(3),
    }
  })
  note(`measured: ${JSON.stringify(perf)}`)
  check('layout shift (CLS) stays low', perf.cls, (c) => c < 0.1, '< 0.1')
  check('no uncaught page errors during the whole journey', p.errors.length, 0)
  check('no CSP violations during the whole journey (fonts, covers, search all allowed)', p.csp.length, 0)
  await shot(p, 'shelf-steady-state')
  await p.context().close()
})

await test('E17', `Accounts ${AUTH_MODE === 'on' ? 'ON (regression only)' : 'OFF'}: the browser never calls account APIs and no account UI appears`, async () => {
  if (AUTH_MODE === 'on') {
    note('skipped: this check only applies to the shipping build (accounts off)')
    return
  }
  const p = await openApp()
  const body = () => p.locator('body').innerText()
  // Shelf journey: quiz → shelf → book page
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  await p.getByRole('button', { name: /^Open book$/i }).click()
  await p.locator('h1', { hasText: 'Atomic Habits' }).waitFor({ timeout: 20000 })
  await sleep(1500)
  check('Shelf book page: no "Your experience" / sign-in section', /Your experience|Sign in to share/i.test(await body()), false)
  await shot(p, 'shelf-book-page-no-account-ui')
  // Classic journey: book page
  await setMode(p, 'classic')
  await sleep(1500)
  check('Classic book page: no "Community Reader Feedback"', /Community Reader Feedback|Sign in to Share Feedback/i.test(await body()), false)
  check('no Sign In button anywhere', await p.getByRole('button', { name: /^Sign In$/i }).count(), 0)
  await shot(p, 'classic-book-page-no-account-ui')
  const calls = p.reqs.filter((u) => /\/api\/auth\/|\/feedback(\?|$)/.test(u))
  note(`requests seen by the browser: ${p.reqs.length}; to /api/auth or /feedback: ${calls.length}`)
  check('browser made zero requests to account or feedback APIs', calls.length, 0)
  await p.context().close()
})


await test('E18', 'Crawlers: the raw HTML (no JavaScript) carries real text, structured data, FAQ, manifest and sitemap', async () => {
  // Plain HTTP fetches, exactly what a search or AI crawler that does not run scripts receives.
  const html = await (await fetch(BASE + '/')).text()
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
  note(`visible text in the raw HTML: ${text.length} characters`)
  check('raw HTML has a real amount of text (> 3,000 chars)', text.length > 3000, true)
  check('raw HTML contains the FAQ question', text.includes('What is True2Readers?'), true)
  check('raw HTML lists the curated books (e.g. Atomic Habits, Gone Girl)', text.includes('Atomic Habits') && text.includes('Gone Girl'), true)
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))
  check('one JSON-LD block that parses', blocks.length, 1)
  const graph = blocks[0]['@graph']
  check('structured data types', graph.map((n) => n['@type']).sort().join(','), 'FAQPage,Organization,WebSite')
  const faqNames = graph.find((n) => n['@type'] === 'FAQPage').mainEntity.map((q) => q.name)
  check('every FAQ question in the structured data is also visible text', faqNames.every((q) => text.includes(q)), true)
  const man = await fetch(BASE + '/manifest.webmanifest')
  check('web app manifest is served', man.status, 200)
  check('manifest start_url', (await man.json()).start_url, '/')
  const sm = await (await fetch(BASE + '/sitemap.xml')).text()
  check('sitemap lists the home page', /<loc>https?:\/\/[^<]+\/<\/loc>/.test(sm), true)
  check('sitemap has no invented lastmod', sm.includes('<lastmod>'), false)
})

await test('E19', 'Page-turn opening is the default; the reader can switch to Book swing and the choice is remembered', async () => {
  const p = await openApp()
  await setMode(p, 'shelf')
  await submitQuiz(p)
  await shelfReady(p)
  const pressed = async (name) => (await p.getByRole('button', { name }).getAttribute('aria-pressed')) === 'true'
  check('Page turn is selected by default', await pressed('Page turn'), true)
  // Sample the full-screen paper sheet while the page turns.
  const samples = await p.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const btn = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().toLowerCase() === 'open book')
    btn.click()
    const out = []
    for (let i = 0; i < 40; i++) {
      await sleep(40)
      const s = [...document.body.children].find((c) => c.getAttribute?.('aria-hidden') === 'true' && c.style.position === 'fixed' && c.style.zIndex === '100')
      out.push(s ? { w: Math.round(s.getBoundingClientRect().width), clip: s.style.clipPath.startsWith('path(') } : { gone: true })
    }
    return out
  })
  const live = samples.filter((s) => !s.gone)
  check('paper sheet grows to the full width', Math.max(...live.map((s) => s.w)) >= 1270, true)
  check('torn-edge reveal runs (clip-path hole)', live.some((s) => s.clip), true)
  check('overlay removed afterwards', samples.some((s) => s.gone), true)
  await p.locator('h1').waitFor({ timeout: 15000 })
  await p.context().close()
  const q = await openApp()
  await setMode(q, 'shelf')
  await submitQuiz(q)
  await shelfReady(q)
  await q.getByRole('button', { name: 'Book swing' }).click()
  check('choice is stored', await q.evaluate(() => localStorage.getItem('shelf-open-style')), 'swing')
  await q.reload()
  await submitQuiz(q)
  await shelfReady(q)
  check('Book swing is still selected after a reload', (await q.getByRole('button', { name: 'Book swing' }).getAttribute('aria-pressed')) === 'true', true)
  await q.context().close()
})

await browser.close()
fs.writeFileSync(path.join(OUT, 'e2e.json'), JSON.stringify({ base: BASE, when: new Date().toISOString(), records }, null, 2))
const failed = records.filter((r) => r.status !== 'PASS')
console.log(`\n${records.length - failed.length}/${records.length} passed`)
process.exit(failed.length ? 1 : 0)
