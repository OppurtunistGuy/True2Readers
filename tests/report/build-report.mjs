/**
 * Builds a single self-contained HTML report (screenshots embedded) from the
 * JSON written by the e2e and security suites.
 *   EVIDENCE_DIR=./uat-evidence AUDIT_PROD=./audit-prod.json node tests/report/build-report.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const DIR = process.env.EVIDENCE_DIR || './uat-evidence'
const REPO = process.env.REPO_DIR || process.cwd()
const e2e = JSON.parse(fs.readFileSync(path.join(DIR, 'e2e.json'), 'utf8'))
const sec = JSON.parse(fs.readFileSync(path.join(DIR, 'security.json'), 'utf8'))
const audit = process.env.AUDIT_PROD && fs.existsSync(process.env.AUDIT_PROD) ? JSON.parse(fs.readFileSync(process.env.AUDIT_PROD, 'utf8')) : null
const git = (c) => {
  try {
    return execSync(c, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return '?'
  }
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const img = (f) => `data:image/jpeg;base64,${fs.readFileSync(path.join(DIR, f)).toString('base64')}`

const pass = e2e.records.filter((r) => r.status === 'PASS').length
const findings = sec.results.filter((r) => r.status === 'FINDING')
const sevCount = (s) => findings.filter((f) => f.severity === s).length
const vulns = audit?.metadata?.vulnerabilities || {}

const e2eRows = e2e.records
  .map(
    (r) => `
<details class="case ${r.status === 'PASS' ? 'ok' : 'bad'}">
  <summary><span class="tag ${r.status === 'PASS' ? 'ok' : 'bad'}">${r.status}</span><b>${esc(r.id)}</b> ${esc(r.title)}<span class="ms">${(r.ms / 1000).toFixed(1)} s</span></summary>
  <ul class="steps">${r.steps.map((s) => `<li class="${/^FAIL/.test(s) ? 'bad' : /^PASS/.test(s) ? 'ok' : 'note'}">${esc(s)}</li>`).join('')}</ul>
  ${r.error ? `<p class="err">${esc(r.error)}</p>` : ''}
  <div class="shots">${r.shots.map((s) => `<figure><img loading="lazy" src="${img(s.file)}" alt="${esc(s.label)}"><figcaption>${esc(s.label)}</figcaption></figure>`).join('')}</div>
</details>`,
  )
  .join('')

const secRows = sec.results
  .map(
    (r) => `
<details class="case ${r.status === 'PASS' ? 'ok' : 'warn'}">
  <summary><span class="tag ${r.status === 'PASS' ? 'ok' : 'warn'}">${r.status === 'PASS' ? 'PASS' : 'FINDING'}</span><span class="sev sev-${r.severity}">${r.severity}</span><b>${esc(r.id)}</b> ${esc(r.title)}</summary>
  ${r.why ? `<p class="why">${esc(r.why)}</p>` : ''}
  <ul class="steps">${r.evidence.map((s) => `<li class="note">${esc(s)}</li>`).join('')}</ul>
</details>`,
  )
  .join('')

const auditRows = audit
  ? Object.values(audit.vulnerabilities || {})
      .filter((v) => ['critical', 'high', 'moderate'].includes(v.severity))
      .sort((a, b) => ['critical', 'high', 'moderate'].indexOf(a.severity) - ['critical', 'high', 'moderate'].indexOf(b.severity))
      .map((v) => {
        const via = (v.via || []).find((y) => typeof y === 'object')?.title || ''
        const fix = v.fixAvailable === true ? 'update available' : v.fixAvailable?.name ? `${v.fixAvailable.name}@${v.fixAvailable.version}${v.fixAvailable.isSemVerMajor ? ' (major)' : ''}` : 'none'
        return `<tr><td><span class="sev sev-${v.severity === 'moderate' ? 'Medium' : 'High'}">${v.severity}</span></td><td>${esc(v.name)}</td><td>${v.isDirect ? 'direct' : 'indirect'}</td><td>${esc(via)}</td><td>${esc(fix)}</td></tr>`
      })
      .join('')
  : ''

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>True2Readers UAT Report</title>
<style>
:root{--bg:#f6f4ef;--card:#fff;--ink:#16181d;--mut:#667;--line:#e2ded3;--ok:#1a7f4b;--okbg:#e5f4ec;--bad:#b42318;--badbg:#fdeceb;--warn:#9a5b00;--warnbg:#fff3dc;--acc:#1f3fb0}
@media(prefers-color-scheme:dark){:root{--bg:#14161a;--card:#1c1f25;--ink:#ecebe6;--mut:#9aa0ac;--line:#2d313a;--ok:#5fd39a;--okbg:#12281d;--bad:#ff8a80;--badbg:#321a18;--warn:#f1b955;--warnbg:#33260d;--acc:#8fa6ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,Segoe UI,Roboto,sans-serif}
main{max-width:1000px;margin:0 auto;padding:28px 16px 80px}h1{font-size:26px;margin:0 0 4px}h2{font-size:18px;margin:34px 0 10px;border-bottom:1px solid var(--line);padding-bottom:6px}
.meta{color:var(--mut);font-size:13px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:18px 0}
.card{background:var(--card);border:1px solid var(--line);padding:14px 16px;border-radius:6px}.card b{display:block;font-size:28px;line-height:1.1}.card span{color:var(--mut);font-size:13px}
.case{background:var(--card);border:1px solid var(--line);border-left-width:4px;margin:8px 0;border-radius:4px}.case.ok{border-left-color:var(--ok)}.case.bad{border-left-color:var(--bad)}.case.warn{border-left-color:var(--warn)}
summary{cursor:pointer;padding:10px 12px;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.ms{margin-left:auto;color:var(--mut);font-size:12px}
.tag{font:700 11px/1 monospace;padding:4px 6px;border-radius:3px}.tag.ok{background:var(--okbg);color:var(--ok)}.tag.bad{background:var(--badbg);color:var(--bad)}.tag.warn{background:var(--warnbg);color:var(--warn)}
.sev{font:600 11px/1 system-ui;padding:3px 6px;border-radius:3px;border:1px solid var(--line);text-transform:uppercase}.sev-High{color:var(--bad)}.sev-Medium{color:var(--warn)}.sev-Low{color:var(--mut)}
.steps{margin:0;padding:4px 14px 10px 30px;font:12.5px/1.55 ui-monospace,Consolas,monospace}.steps li.ok{color:var(--ok)}.steps li.bad{color:var(--bad)}.steps li.note{color:var(--mut)}
.why{margin:0;padding:2px 14px 6px;color:var(--warn);font-weight:600}.err{color:var(--bad);padding:0 14px}
.shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;padding:0 12px 12px}figure{margin:0}img{width:100%;border:1px solid var(--line);border-radius:3px;display:block}figcaption{font-size:11px;color:var(--mut);padding-top:3px}
table{width:100%;border-collapse:collapse;background:var(--card);font-size:13px}td,th{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
code{background:var(--card);border:1px solid var(--line);padding:1px 5px;border-radius:3px}
</style></head><body><main>
<h1>True2Readers — UAT test report</h1>
<div class="meta">Branch <code>${esc(git('git rev-parse --abbrev-ref HEAD'))}</code> · commit <code>${esc(git('git rev-parse --short HEAD'))}</code> · run ${esc(e2e.when)} · target <code>${esc(e2e.base)}</code> (local dev server, throw-away database copy) · real Chromium via Playwright</div>
<div class="cards">
 <div class="card"><b style="color:var(--${pass === e2e.records.length ? 'ok' : 'bad'})">${pass}/${e2e.records.length}</b><span>end-to-end tests passed</span></div>
 <div class="card"><b>${sec.results.length - findings.length}/${sec.results.length}</b><span>security checks passed</span></div>
 <div class="card"><b style="color:var(--bad)">${sevCount('High')} high · ${sevCount('Medium')} med · ${sevCount('Low')} low</b><span>security findings</span></div>
 <div class="card"><b>${vulns.high ?? '?'} high · ${vulns.moderate ?? '?'} mod · ${vulns.critical ?? 0} crit</b><span>production dependency vulnerabilities</span></div>
</div>
<h2>1. End-to-end tests (what a user does)</h2>
<p class="meta">Each case lists every assertion as <i>expected → actual</i>. Click a case to see its steps and screenshots.</p>
${e2eRows}
<h2>2. Security tests</h2>
<p class="meta">Each check asserts the <b>secure</b> behaviour, so a FINDING means the check failed. Run against a local instance only; test accounts were created in a copy of the database.</p>
${secRows}
<h2>3. Dependency vulnerabilities (production only, <code>npm audit --omit=dev</code>)</h2>
${audit ? `<table><tr><th>Severity</th><th>Package</th><th>Type</th><th>Issue</th><th>Fix</th></tr>${auditRows}</table>` : '<p>Audit data not supplied.</p>'}
<h2>How to reproduce</h2>
<pre><code>npm i --no-save playwright-core
DATABASE_URL=file:/path/to/test.db npm run dev
CHROME_PATH=&lt;chrome.exe&gt; EVIDENCE_DIR=./uat-evidence node tests/e2e/uat-e2e.mjs
EVIDENCE_DIR=./uat-evidence node tests/security/api-security.mjs
EVIDENCE_DIR=./uat-evidence node tests/report/build-report.mjs</code></pre>
</main></body></html>`

fs.writeFileSync(path.join(DIR, 'uat-report.html'), html)
console.log('wrote', path.join(DIR, 'uat-report.html'), `(${(html.length / 1024 / 1024).toFixed(2)} MB)`)
