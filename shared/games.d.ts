import type { CardProps, DockIconTheme, IconName } from "@zen-ds/react";

export type CardColor = NonNullable<CardProps["color"]>;

export type GameId = "poll" | "whois" | "rebus" | "quiz" | "ab" | "reaction" | "color" | "center";
export type GameSet = "warmup" | "uiux";
export type GameCounts = Record<GameId, number>;
export interface GameMeta {
  id: GameId;
  set: GameSet;
  kind: "question" | "challenge";
  title: string;
  emoji: string;
  /** Emoji trang trí quanh hình chính ở màn giới thiệu. */
  art: string[];
  theme: DockIconTheme & ("pink" | "yellow" | "blue" | "violet" | "green" | "orange");
  /** Màu thẻ Subtle. */
  card: CardColor;
  /** Màu thẻ Solid (chỉ neutral, brand, cyan, yellow, orange, accent có Solid). */
  hero: "neutral" | "brand" | "cyan" | "yellow" | "orange" | "accent";
  short: string;
  howTo: string[];
  seconds: number;
  estimate: number;
}
export declare const GAMES: Record<GameId, GameMeta>;
export declare const GAME_ORDER: GameId[];
export type PackId = "quick" | "full" | "uiux";
export declare const PACKS: Record<PackId, { title: string; set: GameSet; games: GameCounts }>;
export declare function estimateSeconds(games: GameCounts): number;
export interface TeamPreset {
  id: string;
  name: string;
  emoji: string;
  icon: IconName;
  theme: "violet" | "blue" | "orange" | "green" | "pink" | "teal";
  card: CardColor;
}
export declare const TEAM_PRESETS: TeamPreset[];
export declare const MIN_TEAMS: number;
export declare const MAX_TEAMS: number;
export declare const NAME_MAX: number;
export declare const FACT_MAX: number;
export declare const AVATARS: string[];
export declare const POLL_POINTS: number;
export declare const WHOIS_AUTHOR_POINTS: number;
export declare const REACTION_ROUNDS: number;
export declare const REACTION_MAX: number;
export declare const REACTION_MIN_MS: number;
export declare function reactionPoints(ms: number): number;
export declare function reactionDelays(seed: string): number[];
export declare const COLOR_POINTS: number;
export declare const CENTER_MAX: number;
export declare const CENTER_ROUNDS: number;
export declare const CENTER_ZERO_AT: number;
export declare const COLOR_MISS_LOCK_MS: number;
export declare const CHALLENGE_LEAD_MS: number;
export declare function answerPoints(correct: boolean, msLeft: number, limitMs: number): number;
export declare function centerPoints(distance: number): number;
export declare function hashString(text: string): number;
export declare function seededRandom(seed: string | number): () => number;
export declare function colorLevel(seed: string, level: number): { size: number; odd: number; base: string; oddColor: string };
export type CenterFill =
  | "support-violet-solid"
  | "support-blue-solid"
  | "support-orange-solid"
  | "support-green-solid"
  | "support-pink-solid"
  | "support-teal-solid";
export declare const CENTER_FILLS: CenterFill[];
export interface CenterTarget {
  type: "rectangle" | "rounded" | "ellipse" | "ring";
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  fill: CenterFill;
}
export declare function centerTargets(seed: string): CenterTarget[];
export declare function shuffle<T>(items: T[], random?: () => number): T[];
