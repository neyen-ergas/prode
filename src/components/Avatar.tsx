interface Props {
  name: string
  color: string
  emoji: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
}

export default function Avatar({ name, color, emoji, size = 'md', className = '' }: Props) {
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold shrink-0 ${className}`}
      style={{ backgroundColor: color }}
    >
      {emoji ? (
        <span className="leading-none">{emoji}</span>
      ) : (
        <span className="text-white leading-none">{name[0].toUpperCase()}</span>
      )}
    </div>
  )
}
