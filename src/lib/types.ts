import type { GameId, TeamPreset } from "../../shared/games.js";
import type { QuizVisual } from "../../shared/content.js";

export type Phase = "lobby" | "intro" | "question" | "reveal" | "leaderboard" | "challenge" | "final";

export interface TeamStanding extends TeamPreset {
  members: number;
  sum: number;
  avg: number;
  score: number;
  rank: number;
}

export interface StepView {
  id: string;
  kind: "intro" | "question" | "challenge";
  game: GameId;
  section: number;
  seed?: string;
  seconds?: number;
  number?: number;
  total?: number;
  prompt?: string;
  options?: string[];
  images?: Array<{ svg: string; alt: string }> | null;
  visual?: QuizVisual | null;
  principle?: string | null;
  answer?: number | null;
  explain?: string | null;
  counts?: number[] | null;
  majority?: number[];
}

export interface CommonView {
  pin: string;
  now: number;
  phase: Phase;
  settings: { mode: "team" | "solo"; assign: "auto" | "choose"; teamScore: "avg" | "sum" };
  sections: Array<{ id: GameId; title: string; emoji: string }>;
  section: number | null;
  step: StepView | null;
  isLastStep: boolean;
  startsAt: number | null;
  endsAt: number | null;
  playerCount: number;
  answeredCount: number;
  teams: TeamStanding[];
}

export interface PlayerSummary {
  id: string;
  name: string;
  teamId: string | null;
  score: number;
  rank: number;
  connected: boolean;
  streak: number;
}

export interface HostPlayer extends PlayerSummary {
  answered: boolean;
  challengeScore: number;
  challengeRound: number;
}

export interface HostView extends CommonView {
  role: "host";
  players: HostPlayer[];
}

export interface ChallengeState {
  level: number;
  round: number;
  score: number;
  misses: number;
  lockedUntil: number;
}

export interface PlayerView extends CommonView {
  role: "player";
  me: PlayerSummary & {
    teamRank: number | null;
    answer: number | null;
    last: { stepId: string; answered: boolean; choice: number | null; correct: boolean; points: number } | null;
    challenge: ChallengeState | null;
  };
  top: PlayerSummary[];
}

export interface RoomPeek {
  pin: string;
  phase: Phase;
  mode: "team" | "solo";
  assign: "auto" | "choose";
  teams: Array<TeamPreset & { members: number }>;
  playerCount: number;
}
