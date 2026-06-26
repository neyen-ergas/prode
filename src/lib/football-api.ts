import type { Match, MatchStatus, Stage } from './types'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

// World Cup 2026: June 11 – July 19
const WC_DATE_RANGE = '20260611-20260719'

function mapStatus(s: string): MatchStatus {
  const map: Record<string, MatchStatus> = {
    STATUS_SCHEDULED: 'SCHEDULED',
    STATUS_TIMED: 'SCHEDULED',
    STATUS_IN_PROGRESS: 'IN_PLAY',
    STATUS_HALFTIME: 'PAUSED',
    STATUS_FINAL: 'FINISHED',
    STATUS_FULL_TIME: 'FINISHED',
    STATUS_POSTPONED: 'POSTPONED',
    STATUS_CANCELED: 'CANCELLED',
  }
  return map[s] ?? 'SCHEDULED'
}

function mapStage(notes: string, round: string): Stage {
  const text = (notes + ' ' + round).toUpperCase()
  if (text.includes('FINAL') && !text.includes('SEMI') && !text.includes('QUARTER') && !text.includes('THIRD')) return 'FINAL'
  if (text.includes('THIRD')) return 'THIRD_PLACE'
  if (text.includes('SEMI')) return 'SEMI_FINALS'
  if (text.includes('QUARTER')) return 'QUARTER_FINALS'
  if (text.includes('ROUND OF 16') || text.includes('LAST 16') || text.includes('ROUND OF SIXTEEN') || text.includes('OCTAVOS')) return 'LAST_16'
  return 'GROUP_STAGE'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(event: any): Match {
  const comp = event.competitions?.[0]
  const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
  const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
  const statusName: string = comp?.status?.type?.name ?? 'STATUS_SCHEDULED'
  const isFinished = statusName === 'STATUS_FINAL' || statusName === 'STATUS_FULL_TIME'
  const notes: string = event.notes?.[0]?.headline ?? ''
  const round: string = comp?.series?.summary ?? event.season?.type?.name ?? ''
  const groupName: string | null = notes.includes('Group') || notes.includes('Grupo') ? notes : null

  return {
    id: String(event.id),
    home_team: home?.team?.displayName ?? 'TBD',
    away_team: away?.team?.displayName ?? 'TBD',
    home_team_crest: home?.team?.logo ?? null,
    away_team_crest: away?.team?.logo ?? null,
    home_score: isFinished && home?.score !== undefined ? parseInt(home.score) : null,
    away_score: isFinished && away?.score !== undefined ? parseInt(away.score) : null,
    match_date: event.date,
    status: mapStatus(statusName),
    stage: mapStage(notes, round),
    group_name: groupName,
    matchday: event.week?.number ?? null,
  }
}

export async function fetchMatches(): Promise<Match[]> {
  const res = await fetch(
    `${ESPN_BASE}/scoreboard?limit=200&dates=${WC_DATE_RANGE}`,
    { next: { revalidate: 60 } }
  )
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`)
  const data = await res.json()
  return (data.events ?? []).map(mapEvent)
}

export async function fetchTeams(): Promise<string[]> {
  const matches = await fetchMatches()
  const teamSet = new Set<string>()
  matches.forEach((m) => {
    if (m.home_team && m.home_team !== 'TBD') teamSet.add(m.home_team)
    if (m.away_team && m.away_team !== 'TBD') teamSet.add(m.away_team)
  })
  return Array.from(teamSet).sort()
}
