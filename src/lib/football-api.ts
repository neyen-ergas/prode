import type { Match, MatchStatus, Stage } from './types'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

function mapStatus(s: string): MatchStatus {
  const map: Record<string, MatchStatus> = {
    STATUS_SCHEDULED: 'SCHEDULED',
    STATUS_IN_PROGRESS: 'IN_PLAY',
    STATUS_HALFTIME: 'PAUSED',
    STATUS_FINAL: 'FINISHED',
    STATUS_FULL_TIME: 'FINISHED',
    STATUS_POSTPONED: 'POSTPONED',
    STATUS_CANCELED: 'CANCELLED',
  }
  return map[s] ?? 'SCHEDULED'
}

function mapStage(groupName: string | null, notes: string): Stage {
  const text = (notes + ' ' + (groupName ?? '')).toUpperCase()
  if (text.includes('FINAL') && !text.includes('SEMI') && !text.includes('QUARTER') && !text.includes('THIRD')) return 'FINAL'
  if (text.includes('THIRD')) return 'THIRD_PLACE'
  if (text.includes('SEMI')) return 'SEMI_FINALS'
  if (text.includes('QUARTER')) return 'QUARTER_FINALS'
  if (text.includes('ROUND OF 16') || text.includes('LAST 16') || text.includes('ROUND OF SIXTEEN')) return 'LAST_16'
  return 'GROUP_STAGE'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(event: any): Match {
  const competition = event.competitions?.[0]
  const home = competition?.competitors?.find((c: any) => c.homeAway === 'home')
  const away = competition?.competitors?.find((c: any) => c.homeAway === 'away')
  const status = competition?.status?.type?.name ?? 'STATUS_SCHEDULED'
  const isFinished = status === 'STATUS_FINAL' || status === 'STATUS_FULL_TIME'
  const notes = event.notes?.[0]?.headline ?? ''
  const groupName = event.season?.slug ?? null

  return {
    id: String(event.id),
    home_team: home?.team?.displayName ?? 'TBD',
    away_team: away?.team?.displayName ?? 'TBD',
    home_team_crest: home?.team?.logo ?? null,
    away_team_crest: away?.team?.logo ?? null,
    home_score: isFinished && home?.score !== undefined ? parseInt(home.score) : null,
    away_score: isFinished && away?.score !== undefined ? parseInt(away.score) : null,
    match_date: event.date,
    status: mapStatus(status),
    stage: mapStage(groupName, notes),
    group_name: notes.includes('Group') ? notes : null,
    matchday: event.week?.number ?? null,
  }
}

export async function fetchMatches(): Promise<Match[]> {
  // ESPN paginates by week; fetch all events via calendar endpoint first
  const calRes = await fetch(`${ESPN_BASE}/calendar/whitelist`, {
    next: { revalidate: 3600 },
  })

  let dates: string[] = []
  if (calRes.ok) {
    const cal = await calRes.json()
    dates = (cal.eventDate?.dates ?? []) as string[]
  }

  if (dates.length === 0) {
    // Fallback: fetch current scoreboard only
    return fetchScoreboard()
  }

  const allMatches: Match[] = []
  // Fetch in batches to avoid rate limiting
  for (let i = 0; i < dates.length; i += 5) {
    const batch = dates.slice(i, i + 5)
    const results = await Promise.all(batch.map((d) => fetchScoreboard(d)))
    allMatches.push(...results.flat())
  }

  // Deduplicate by id
  const seen = new Set<string>()
  return allMatches.filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
}

async function fetchScoreboard(date?: string): Promise<Match[]> {
  const url = date
    ? `${ESPN_BASE}/scoreboard?dates=${date.replace(/-/g, '')}&limit=50`
    : `${ESPN_BASE}/scoreboard?limit=50`

  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) return []
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
