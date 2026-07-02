import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Stage } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const STAGE_LABELS: Record<Stage, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  ROUND_OF_32: 'Dieciseisavos de Final',
  LAST_16: 'Octavos de Final',
  QUARTER_FINALS: 'Cuartos de Final',
  SEMI_FINALS: 'Semifinales',
  THIRD_PLACE: 'Tercer Puesto',
  FINAL: 'Final',
}

export const STAGE_ORDER: Stage[] = [
  'GROUP_STAGE',
  'ROUND_OF_32',
  'LAST_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE',
  'FINAL',
]

export function formatMatchDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isMatchLocked(matchDate: string, status: string): boolean {
  if (status === 'FINISHED') return true
  return new Date(matchDate) <= new Date()
}
