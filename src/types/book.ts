export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface BookMetadata {
  title: string;
  author: string;
  language: string;
  pageCountEstimated?: string | number;
  mainGenre: string;
  oneSentenceThesis: string;
  detailedExecutiveSummary: string;
  tableOfContents: {
    chapterNumber: number;
    title: string;
    brief: string;
  }[];
  keyConcepts: string[];
  suggestedDeepQuestions: string[];
}

export interface ActiveBook {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileBase64?: string;
  pages: ExtractedPage[];
  fullText: string;
  totalWords: number;
  numPages: number;
  inspectedMetadata?: BookMetadata;
}

export interface QAMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  quotes?: string[];
  pageReferences?: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
