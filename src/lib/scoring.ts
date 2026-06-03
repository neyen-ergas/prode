export const POINTS = {
  EXACT_SCORE: 3,
  CORRECT_RESULT: 1,
  CHAMPION: 10,
} as const

function getResult(home: number, away: number): 'HOME' | 'DRAW' | 'AWAY' {
  if (home > away) return 'HOME'
  if (home < away) return 'AWAY'
  return 'DRAW'
}

export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return POINTS.EXACT_SCORE
  }
  if (getResult(predictedHome, predictedAway) === getResult(actualHome, actualAway)) {
    return POINTS.CORRECT_RESULT
  }
  return 0
}
