/**
 * "Poster" opening for the shelf: a paper sheet rises from the clicked cover to
 * fill the screen, the book page is swapped in underneath, then a torn-edged
 * hole grows from the centre and reveals it.
 *
 * Plain DOM on purpose: the shelf unmounts the moment the page swaps, so a React
 * overlay owned by the shelf would vanish halfway through the reveal.
 */
const PAPER = '#ECE8E0'

export function playPosterOpen(rect: DOMRect, swap: () => void) {
  const paper = document.createElement('div')
  paper.setAttribute('aria-hidden', 'true')
  Object.assign(paper.style, {
    position: 'fixed',
    zIndex: '100',
    pointerEvents: 'none',
    background: PAPER,
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    boxShadow: '0 30px 60px -20px rgba(20,16,10,0.5)',
  })
  document.body.appendChild(paper)
  const remove = () => paper.remove()
  const failsafe = window.setTimeout(remove, 3000)

  const rise = paper.animate(
    [
      { top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px`, transform: 'rotate(-1.5deg)' },
      { top: '0px', left: '0px', width: '100vw', height: '100vh', transform: 'rotate(0deg)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
    ],
    { duration: 420, easing: 'cubic-bezier(0.76, 0, 0.18, 1)', fill: 'forwards' },
  )

  rise.onfinish = () => {
    rise.cancel()
    Object.assign(paper.style, { top: '0', left: '0', width: '100vw', height: '100vh', boxShadow: 'none' })
    swap()
    window.setTimeout(() => reveal(paper, () => { window.clearTimeout(failsafe); remove() }), 160)
  }
}

function reveal(paper: HTMLElement, done: () => void) {
  const W = window.innerWidth
  const H = window.innerHeight
  const maxR = Math.hypot(W, H) * 0.62
  const N = 56
  // Fixed jitter so the torn edge is ragged but the same every time.
  const jit = Array.from({ length: N }, (_, i) => 0.84 + 0.32 * ((Math.abs(Math.sin(i * 12.9898) * 43758.5453)) % 1))
  const start = performance.now()
  const D = 700
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / D)
    const r = (1 - Math.pow(1 - t, 3)) * maxR
    let d = `M0 0H${W}V${H}H0Z`
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      const x = W / 2 + Math.cos(a) * r * jit[i]
      const y = H / 2 + Math.sin(a) * r * jit[i]
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    }
    paper.style.clipPath = `path(evenodd, "${d}Z")`
    if (t < 1) requestAnimationFrame(frame)
    else done()
  }
  requestAnimationFrame(frame)
}
