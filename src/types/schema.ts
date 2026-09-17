export interface Module {
  id: string;
  title: string;
  order: number;
  lessonCount: number;
  status?: 'ready' | 'draft';
  estimatedHours?: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  estimatedMinutes: number;
  cards: Card[];
}

export type Card = 
  | TheoryCard 
  | RunnableCard 
  | MultipleChoiceCard 
  | FillBlankCard 
  | CodeChallengeCard 
  | SummaryCard
  | ReorderCard
  | PredictOutputCard;

export interface TheoryCard {
  type: 'theory';
  content: string;
  image?: { src: string; alt: string };
}

export interface RunnableCard {
  type: 'runnable';
  code: string;
}

export interface MultipleChoiceCard {
  type: 'multiple_choice';
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface FillBlankCard {
  type: 'fill_blank';
  code: string;
  answers: string[];
}

export interface CodeChallengeCard {
  type: 'code_challenge';
  prompt: string;
  starterCode: string;
  tests: {
    input: string;
    expectedOutput: string;
  }[];
  hints: string[];
  solution?: string;
}

export interface ReorderCard {
  type: 'reorder';
  prompt: string;
  lines: string[];
  correctOrder: number[];
}

export interface PredictOutputCard {
  type: 'predict_output';
  code: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface SummaryCard {
  type: 'summary';
  points: string[];
}

export interface UserProgress {
  completedLessons: string[];
  moduleStatus: Record<string, 'locked' | 'unlocked' | 'completed'>;
  quizScores: Record<string, { score: number; passed: boolean }>;
  xp: number;
  streak: number;
  lastActiveDate: string;
  maxSeenDate?: string;
  version?: number;
  unlockAll?: boolean;
  justReset?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  code?: string;
  options: string[];
  answer: number;
  explanation: string;
}
