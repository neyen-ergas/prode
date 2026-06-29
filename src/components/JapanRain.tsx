'use client'

const DROPS = [
  { left: '8%',  delay: '0s',   dur: '3.5s' },
  { left: '18%', delay: '1.2s', dur: '3.1s' },
  { left: '29%', delay: '0.4s', dur: '3.8s' },
  { left: '40%', delay: '2.1s', dur: '3.3s' },
  { left: '52%', delay: '0.8s', dur: '3.6s' },
  { left: '63%', delay: '1.7s', dur: '3.0s' },
  { left: '74%', delay: '3.0s', dur: '3.4s' },
  { left: '85%', delay: '0.2s', dur: '3.7s' },
  { left: '22%', delay: '2.8s', dur: '3.2s' },
  { left: '68%', delay: '1.5s', dur: '3.9s' },
]

export default function JapanRain() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {DROPS.map((drop, i) => (
        <span
          key={i}
          className="absolute top-0 text-sm"
          style={{
            left: drop.left,
            opacity: 0,
            animation: `japan-rain-fall ${drop.dur} linear ${drop.delay} infinite backwards`,
          }}
        >
          💧
        </span>
      ))}
    </div>
  )
}
