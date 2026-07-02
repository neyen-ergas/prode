export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED'

export type Stage =
  | 'GROUP_STAGE'
  | 'ROUND_OF_32'
  | 'LAST_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'THIRD_PLACE'
  | 'FINAL'

export interface User {
  id: string
  name: string
  color: string
  emoji: string | null
  created_at: string
}

export interface Match {
  id: string
  home_team: string
  away_team: string
  home_team_crest: string | null
  away_team_crest: string | null
  home_score: number | null
  away_score: number | null
  match_date: string
  status: MatchStatus
  stage: Stage
  group_name: string | null
  matchday: number | null
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  home_score: number
  away_score: number
  points: number | null
  updated_at: string
}

export interface ChampionPrediction {
  id: string
  user_id: string
  team: string
}

export interface RankingEntry {
  user: User
  total_points: number
  exact_scores: number
  correct_results: number
  predictions_count: number
  champion_team: string | null
  champion_points: number
}
