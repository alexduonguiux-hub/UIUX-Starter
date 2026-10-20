export type QuizVisual = { type: "swatch"; color: string } | { type: "svg"; svg: string; alt: string };
export declare const QUIZ: Array<{ id: string; prompt: string; options: string[]; answer: number; explain?: string; visual?: QuizVisual }>;
export declare const AB: Array<{ id: string; prompt: string; principle: string; explain: string; good: string; bad: string; goodAlt: string; badAlt: string }>;
export declare const POLLS: Array<{ id: string; prompt: string; options: [{ emoji: string; label: string }, { emoji: string; label: string }] }>;
export declare const REBUS: Array<{ id: string; category: string; emoji: string; options: string[]; answer: number; explain?: string }>;
