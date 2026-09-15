export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  source?: string;
  topic?: string;
  suggestedQuestions?: string[];
  quizData?: QuizQuestion[];
  isError?: boolean;
  suggestAudio?: boolean;
  bookName?: string;
}

export interface LessonItem {
  id: string;
  title: string;
  titleEn: string;
  summary: string;
  explanation: string[];
  sampleQuestions: QuizQuestion[];
  keyPoints: string[];
}

export interface CurriculumSubject {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  lessons: LessonItem[];
}

export interface CurriculumStage {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  subjects: CurriculumSubject[];
}

export interface StudentProfile {
  points: number;
  streak: number;
  lastActiveDate: string;
  completedLessons: string[];
  totalQuestionsAsked: number;
  correctQuizAnswers: number;
  totalQuizAnswers: number;
}

export type ExplanationMode = 'detailed' | 'simple' | 'solver' | 'quiz' | 'bilingual';

export interface BookChapter {
  title: string;
  page?: number;
  excerpt: string;
}

export interface UploadedBook {
  id: string;
  name: string;
  realTitle?: string;
  subject?: string;
  grade?: string;
  originalFileName: string;
  size: number;
  pageCount: number;
  textSnippet: string;
  fullText: string;
  chapters: BookChapter[];
  summary?: string;
  uploadDate: number;
}

export interface ZipArchiveResult {
  zipName: string;
  totalPdfsFound: number;
  books: UploadedBook[];
}

