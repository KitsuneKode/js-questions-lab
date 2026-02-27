export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuestionCodeBlock {
  id: string;
  order: number;
  language: string;
  code: string;
}

export interface QuestionRecord {
  id: number;
  slug: string;
  title: string;
  promptMarkdown: string;
  codeBlocks: QuestionCodeBlock[];
  explanationCodeBlocks: QuestionCodeBlock[];
  options: QuestionOption[];
  correctOption: QuestionOption['key'] | null;
  explanationMarkdown: string;
  images: string[];
  tags: string[];
  difficulty: Difficulty;
  runnable: boolean;
  source: {
    startLineHint: number | null;
  };
}

export interface TranslationEntry {
  label: string;
  href: string;
}

export interface QuestionsManifest {
  schemaVersion: number;
  generatedAt: string;
  source: {
    repo: string;
    file: string;
    localPath: string;
  };
  totals: {
    questions: number;
    runnable: number;
    withImages: number;
  };
  tags: string[];
  translations: TranslationEntry[];
  attribution: {
    creator: string;
    repo: string;
    requestReference: boolean;
  };
}
