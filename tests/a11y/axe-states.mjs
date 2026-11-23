// Accessibility gate (axe-core). Needs the app running and: npm i --no-save playwright-core @axe-core/playwright
// Run: CHROME_PATH=<chrome> BASE_URL=http://localhost:3001 node tests/a11y/axe-states.mjs   (exit 1 on any serious/critical violation)
import { chromium } from 'playwright-core'
import AxeBuilder from '@axe-core/playwright'
const BASE = process.env.BASE_URL || 'http://localhost:3001'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true })
const out = []
async function audit(name, page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze()
  const v = r.violations.map((x) => ({ id: x.id, impact: x.impact, nodes: x.nodes.length, help: x.help, sample: (x.nodes[0]?.target || []).join(' ').slice(0, 70) }))
  out.push({ name, v })
}
async function fresh(viewport, shelf) {
  const ctx = await browser.newContext({ viewport })
  const p = await ctx.newPage()
  await p.goto(BASE, { waitUntil: 'domcontentloaded' })
  await p.getByText('What are you in the mood to read?').waitFor()
  await sleep(700)
  if (shelf) { await p.locator('[aria-label="Browsing style"] button', { hasText: /^shelf$/i }).click(); await sleep(400) }
  return p
}
let p = await fresh({ width: 1280, height: 800 }, false)
await audit('1 Home / mood quiz (Classic)', p)
await p.getByText('Show books that fit').click(); await p.getByText("Books that fit what you're looking for").waitFor(); await sleep(800)
await audit('2 Quiz results (Classic)', p)
await p.getByText('View book experience').first().click(); await p.locator('h1', { hasText: 'Atomic Habits' }).waitFor(); await sleep(1500)
await audit('3 Book page (Classic)', p)
await p.context().close()
p = await fresh({ width: 1280, height: 800 }, true)
await p.getByText('Show books that fit').click(); await p.locator('[data-shelf] [data-shelf-item]').first().waitFor(); await sleep(1500)
await audit('4 Shelf (quiz picks)', p)
await p.getByRole('button', { name: /^Open book$/i }).click(); await p.locator('h1', { hasText: 'Atomic Habits' }).waitFor(); await sleep(1800)
await audit('5 Book page (Shelf)', p)
await p.context().close()
p = await fresh({ width: 375, height: 812 }, true)
await p.getByText('Show books that fit').click(); await p.locator('[data-shelf] [data-shelf-item]').first().waitFor(); await sleep(1500)
await audit('6 Shelf on a phone (375px)', p)
await p.context().close()
await browser.close()
for (const s of out) {
  console.log(`\n### ${s.name}: ${s.v.length} rule(s) violated`)
  for (const x of s.v) console.log(`  [${x.impact}] ${x.id} x${x.nodes}: ${x.help} (e.g. ${x.sample})`)
}

const bad = out.flatMap((s) => s.v).filter((x) => x.impact === "serious" || x.impact === "critical")
console.log(
  bad.length
    ? `\nFAIL: ${bad.length} serious/critical rule violation(s)`
    : '\nPASS: no serious or critical accessibility violations on any screen',
)
process.exitCode = bad.length ? 1 : 0
