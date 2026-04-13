export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuestionResource {
  type: 'video' | 'blog' | 'docs' | 'repo';
  title: string;
  url: string;
  author?: string;
}

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

export type QuestionRuntimeKind = 'javascript' | 'dom-click-propagation' | 'static';

export interface QuestionRuntime {
  kind: QuestionRuntimeKind;
}

export interface QuestionRecord {
  id: number;
  slug: string;
  /** Locale this record was parsed from (e.g. "en", "es"). */
  locale: string;
  /**
   * Set to true when this record was injected as an English fallback inside a
   * non-English locale dataset (i.e. the locale source was missing this question id).
   */
  isFallback?: boolean;
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
  runtime: QuestionRuntime;
  resources?: QuestionResource[];
  source: {
    startLineHint: number | null;
  };
}

export interface QuestionSummary {
  id: number;
  slug: string;
  locale: string;
  isFallback?: boolean;
  title: string;
  tags: string[];
  difficulty: Difficulty;
  runnable: boolean;
}

export interface QuestionDiscoveryItem extends QuestionSummary {
  searchText: string;
  previewCode: string;
}

export interface TranslationEntry {
  label: string;
  href: string;
}

// ---------------------------------------------------------------------------
// Locale availability (written by parse-readme.mjs into the locale index)
// ---------------------------------------------------------------------------

export interface LocaleAvailability {
  code: string;
  label: string;
  questionCount: number;
  sourceHash: string;
  generatedAt: string;
}

export interface LocaleIndex {
  schemaVersion: number;
  generatedAt: string;
  supported: string[];
  default: string;
  available: LocaleAvailability[];
}

// ---------------------------------------------------------------------------
// Per-locale manifest (content/generated/locales/<locale>/manifest.v1.json)
// ---------------------------------------------------------------------------

export interface QuestionsManifest {
  schemaVersion: number;
  generatedAt: string;
  locale: {
    code: string;
    label: string;
    dir: 'ltr' | 'rtl';
  };
  source: {
    repo: string;
    upstreamPath?: string;
    /** @deprecated use upstreamPath */
    file?: string;
    localPath: string;
    sha256?: string;
    /** Latest Git commit SHA from the upstream repository at time of sync. */
    upstreamCommit?: string | null;
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
