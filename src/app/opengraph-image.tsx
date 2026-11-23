import { ImageResponse } from 'next/og'

export const alt = 'True2Readers — know how a book reads before you buy it'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Brand colours: navy #0F172A, blue #2563EB, slate-50 #F8FAFC.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: '#F8FAFC',
          borderLeft: '24px solid #2563EB',
        }}
      >
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 800 }}>
          <span style={{ color: '#0F172A' }}>True2</span>
          <span style={{ color: '#2563EB' }}>Readers</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -2,
              color: '#0F172A',
            }}
          >
            Know how a book reads
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -2,
              color: '#2563EB',
            }}
          >
            before you buy it.
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 32, color: '#64748B' }}>
          Pacing, writing style, effort — and who it may not suit.
        </div>
      </div>
    ),
    size,
  )
}
