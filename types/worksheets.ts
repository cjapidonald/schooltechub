export type Stage =
  | 'K'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type WorksheetFormat = 'pdf' | 'digital';
export type WorksheetStatus = 'draft' | 'published';

export interface WorksheetCard {
  id: string;
  title: string;
  slug: string;
  overview: string | null;
  stage: Stage;
  subjects: string[];
  skills: string[];
  worksheet_type: string | null;
  difficulty: Difficulty | null;
  format: WorksheetFormat;
  thumbnail_url: string | null;
  hasAnswerKey: boolean;
}

export interface Worksheet {
  id: string;
  title: string;
  slug: string;
  overview: string | null;
  stage: Stage;
  subjects: string[];
  skills: string[];
  worksheet_type: string | null;
  difficulty: Difficulty | null;
  format: WorksheetFormat;
  tech_integrated: boolean;
  thumbnail_url: string | null;
  page_images: string[];
  pdf_url: string | null;
  answer_key_url: string | null;
  language: string | null;
  tags: string[];
  status: WorksheetStatus;
  created_at: string | null;
  published_at: string | null;
  hasAnswerKey: boolean;
}

export interface WorksheetListResponse {
  items: WorksheetCard[];
  nextCursor: string | null;
}

export interface WorksheetRecord {
  id: string;
  title: string;
  slug: string;
  overview?: string | null;
  stage: Stage;
  subjects?: string[] | null;
  skills?: string[] | null;
  worksheet_type?: string | null;
  difficulty?: Difficulty | null;
  format: WorksheetFormat;
  tech_integrated?: boolean | null;
  thumbnail_url?: string | null;
  page_images?: string[] | null;
  pdf_url?: string | null;
  answer_key_url?: string | null;
  language?: string | null;
  tags?: string[] | null;
  status?: WorksheetStatus | null;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  has_answer_key?: boolean | null;
}
