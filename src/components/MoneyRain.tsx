'use client'

const ITEMS = [
  { emoji: '💵', left: '3%',  delay: '0s',    dur: '7s',   size: '1.2rem' },
  { emoji: '🪙', left: '10%', delay: '2.1s',  dur: '5.5s', size: '1rem'   },
  { emoji: '💵', left: '18%', delay: '0.8s',  dur: '6.5s', size: '1.4rem' },
  { emoji: '🪙', left: '26%', delay: '3.5s',  dur: '5.2s', size: '0.9rem' },
  { emoji: '💵', left: '35%', delay: '1.3s',  dur: '7.5s', size: '1.1rem' },
  { emoji: '🪙', left: '44%', delay: '4.2s',  dur: '6.1s', size: '1.2rem' },
  { emoji: '💵', left: '52%', delay: '0.5s',  dur: '5.8s', size: '1rem'   },
  { emoji: '🪙', left: '60%', delay: '2.8s',  dur: '7.2s', size: '1.3rem' },
  { emoji: '💵', left: '68%', delay: '1.7s',  dur: '5.6s', size: '1.1rem' },
  { emoji: '🪙', left: '76%', delay: '3.1s',  dur: '6.8s', size: '0.9rem' },
  { emoji: '💵', left: '84%', delay: '0.3s',  dur: '7.3s', size: '1.2rem' },
  { emoji: '🪙', left: '91%', delay: '4.7s',  dur: '5.4s', size: '1rem'   },
  { emoji: '💵', left: '22%', delay: '5.5s',  dur: '6.9s', size: '1rem'   },
  { emoji: '🪙', left: '57%', delay: '2.4s',  dur: '5.7s', size: '1.1rem' },
  { emoji: '💵', left: '79%', delay: '6.1s',  dur: '6.3s', size: '0.9rem' },
]

export default function MoneyRain() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {ITEMS.map((item, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={{
            left: item.left,
            fontSize: item.size,
            opacity: 0.13,
            animation: `money-fall ${item.dur} linear ${item.delay} infinite`,
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  )
}
