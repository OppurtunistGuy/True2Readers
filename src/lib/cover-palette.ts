/** Stable [background, text] colours per title, for generated covers. */
const PALETTE: Array<[string, string]> = [
  ['#1d1b1a', '#efe5cf'],
  ['#2543b4', '#efe5cf'],
  ['#b83220', '#efe5cf'],
  ['#efe5cf', '#1d1b1a'],
  ['#2f5d50', '#efe5cf'],
  ['#d9a441', '#1d1b1a'],
  ['#5a3e6b', '#efe5cf'],
]

export function paletteFor(title: string): [string, string] {
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}
