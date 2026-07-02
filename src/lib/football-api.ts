import type { Match, MatchStatus, Stage } from './types'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

// Count goals for a team in the first 90 minutes only (clock.value <= 5400s).
// Own goals: team.id is the player's team (defender), goal counts for the opponent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function regulationGoals(details: any[], teamId: string, opponentId: string): number {
  return details.filter(d => {
    if (!d.scoringPlay || d.shootout || d.clock?.value > 5400) return false
    return d.ownGoal ? d.team?.id === opponentId : d.team?.id === teamId
  }).length
}

// World Cup 2026: June 11 – July 19
const WC_DATE_RANGE = '20260611-20260719'

// ESPN's `type.completed` flag is authoritative for "match over" regardless of
// how it ended (full time, AET, penalties) — safer than enumerating every
// STATUS_FINAL_* variant, which missed STATUS_FINAL_AET (see Belgium-Senegal R32).
function mapStatus(s: string, completed: boolean): MatchStatus {
  if (completed) return 'FINISHED'
  const map: Record<string, MatchStatus> = {
    STATUS_SCHEDULED: 'SCHEDULED',
    STATUS_TIMED: 'SCHEDULED',
    STATUS_IN_PROGRESS: 'IN_PLAY',
    STATUS_HALFTIME: 'PAUSED',
    STATUS_POSTPONED: 'POSTPONED',
    STATUS_CANCELED: 'CANCELLED',
  }
  return map[s] ?? 'SCHEDULED'
}

// event.season.slug is ESPN's own structured stage identifier — reliable
// regardless of locale/wording, unlike the free-text notes/series.summary
// this used to parse (which was empty for round-of-32 and silently fell
// back to GROUP_STAGE, e.g. Belgium-Senegal).
const SLUG_TO_STAGE: Record<string, Stage> = {
  'group-stage': 'GROUP_STAGE',
  'round-of-32': 'ROUND_OF_32',
  'round-of-16': 'LAST_16',
  'quarterfinals': 'QUARTER_FINALS',
  'semifinals': 'SEMI_FINALS',
  '3rd-place-match': 'THIRD_PLACE',
  'final': 'FINAL',
}

function mapStage(slug: string | undefined): Stage {
  return SLUG_TO_STAGE[slug ?? ''] ?? 'GROUP_STAGE'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(event: any): Match {
  const comp = event.competitions?.[0]
  const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
  const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
  const statusName: string = comp?.status?.type?.name ?? 'STATUS_SCHEDULED'
  const isFinished = comp?.status?.type?.completed === true
  const notes: string = event.notes?.[0]?.headline ?? ''
  const groupName: string | null = notes.includes('Group') || notes.includes('Grupo') ? notes : null

  // Use regulation-only (90 min) score. If extra time was played (period > 2),
  // recalculate from goal events with clock.value <= 5400s.
  const period: number = comp?.status?.period ?? 2
  const details: any[] = comp?.details ?? []
  const hadExtraTime = isFinished && period > 2
  const homeId: string = home?.team?.id ?? ''
  const awayId: string = away?.team?.id ?? ''

  const homeScore = !isFinished ? null
    : hadExtraTime ? regulationGoals(details, homeId, awayId)
    : home?.score !== undefined ? parseInt(home.score) : null

  const awayScore = !isFinished ? null
    : hadExtraTime ? regulationGoals(details, awayId, homeId)
    : away?.score !== undefined ? parseInt(away.score) : null

  return {
    id: String(event.id),
    home_team: home?.team?.displayName ?? 'TBD',
    away_team: away?.team?.displayName ?? 'TBD',
    home_team_crest: home?.team?.logo ?? null,
    away_team_crest: away?.team?.logo ?? null,
    home_score: homeScore,
    away_score: awayScore,
    match_date: event.date,
    status: mapStatus(statusName, isFinished),
    stage: mapStage(event.season?.slug),
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
