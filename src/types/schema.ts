export interface Course {
  id: string;
  title: string;
  language: string;
  order: number;
  description?: string;
  status?: 'ready' | 'soon';
}

export interface Module {
  id: string;
  courseId?: string;
  title: string;
  order: number;
  lessonCount: number;
  status?: 'ready' | 'draft';
  requires?: string;
  estimatedHours?: number;
  language?: 'java' | 'javascript';
}

export interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  estimatedMinutes: number;
  runnable?: boolean;
  javaVersion?: number;
  cards: Card[];
}

export interface UnderstandingCheckCard {
  type: 'understanding_check';
  minCorrect: number;
  questions: {
    question: string;
    code?: string;
    options: string[];
    answer: number;
    explanation: string;
    remedial: string;
  }[];
}

export type Card =
  | TheoryCard
  | RunnableCard
  | MultipleChoiceCard
  | FillBlankCard
  | CodeChallengeCard
  | SummaryCard
  | ReorderCard
  | PredictOutputCard
  | UnderstandingCheckCard;

export interface TheoryCard {
  type: 'theory';
  content: string;
  image?: { src: string; alt: string };
}

export interface RunnableCard {
  type: 'runnable';
  html?: string;
  code: string;
  predict?: {
    question: string;
    options: string[];
    answer: number;
  };
  annotations?: { line: number; note: string }[];
  explanation?: string;
  tryThis?: { task: string; hint?: string }[];
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
  html?: string;
  prompt: string;
  starterCode: string;
  steps?: string[];
  skeleton?: string;
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
  passedChecks?: string[];
  moduleStatus: Record<string, 'locked' | 'unlocked' | 'completed'>;
  quizScores: Record<string, { score: number; passed: boolean }>;
  xp: number;
  streak: number;
  lastActiveDate: string;
  maxSeenDate?: string;
  version?: number;
  unlockAll?: boolean;
  justReset?: boolean;
  resetAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  code?: string;
  options: string[];
  answer: number;
  explanation: string;
}
