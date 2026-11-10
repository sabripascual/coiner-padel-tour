export type Sex = "F" | "M";
export type TournamentStatus = "borrador" | "en_curso" | "finalizado";

export type Profile = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  sex: Sex;
  avatar_url: string | null;
  is_admin: boolean;
  active: boolean;
};

export type Tournament = {
  id: string;
  name: string;
  status: TournamentStatus;
  champion_f: string | null;
  champion_m: string | null;
  created_at: string;
  finished_at: string | null;
};

export type Round = {
  id: string;
  tournament_id: string;
  number: number;
  played_on: string | null;
  place: string | null;
  start_time: string | null;   // "19:30:00"
  court_cost: number | null;
};

export type RoundStat = {
  round_id: string;
  player_id: string;
  played: number;
  won: number;
  games: number;
};

export type RankingRow = {
  player_id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  sex: Sex;
  avatar_url: string | null;
  played: number;
  won: number;
  games: number;
  points: number;
  rounds_attended?: number;
  tournaments_played?: number;
  titles?: number;
};

export type Photo = {
  id: string;
  uploader_id: string;
  round_id: string | null;
  path: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
};
