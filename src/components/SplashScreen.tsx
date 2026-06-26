'use client'

import { useEffect, useState } from 'react'

const ANIMS = [
  { ball: 'ball-cross', shadow: 'shadow-cross', dur: '1.4s' },
  { ball: 'ball-lob',   shadow: 'shadow-lob',   dur: '1.6s' },
  { ball: 'ball-skip',  shadow: 'shadow-skip',  dur: '1.3s' },
  { ball: 'ball-rev',   shadow: 'shadow-rev',   dur: '1.4s' },
]

export default function SplashScreen({ name }: { name: string }) {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const [anim] = useState(() => ANIMS[Math.floor(Math.random() * ANIMS.length)])

  useEffect(() => {
    setTimeout(() => setFading(true), 1600)
    setTimeout(() => setVisible(false), 2000)
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#030712] transition-opacity duration-300 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Texto — zona superior */}
      <div className="absolute inset-x-0 top-[28%] flex flex-col items-center gap-1">
        <p className="text-gray-400 text-lg">Hola de vuelta</p>
        <p className="text-white text-3xl font-bold">{name} 👋</p>
      </div>

      {/* Sombra en el piso — zona inferior */}
      <div
        className="absolute rounded-full"
        style={{
          top: 'calc(68% + 64px)',
          left: 0,
          width: '60px',
          height: '10px',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.55) 0%, transparent 70%)',
          transformOrigin: 'center',
          animation: `${anim.shadow} ${anim.dur} ease-in-out forwards`,
        }}
      />

      {/* Pelota — zona inferior */}
      <div
        className="absolute text-7xl"
        style={{
          top: '68%',
          left: 0,
          animation: `${anim.ball} ${anim.dur} ease-in-out forwards`,
        }}
      >
        ⚽
      </div>
    </div>
  )
}
