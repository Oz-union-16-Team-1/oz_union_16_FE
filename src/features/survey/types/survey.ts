export type SurveySessionStatus =
  | 'IDLE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED';

export type SurveyMessageRole = 'assistant' | 'user';

export interface SurveyMessage {
  id: string;
  role: SurveyMessageRole;
  content: string;
  createdAt: string;
}

export interface SurveyProgress {
  current_step: number;
  total_steps: number;
  completion_rate: number;
}

export interface SurveySessionStartRequest {
  message?: string;
}

export interface SurveySessionStartResponse {
  session_id: string;
  ai_question: string;
  status: SurveySessionStatus;
  progress?: SurveyProgress;
}

export interface SurveyChatRequest {
  session_id: string;
  user_answer: string;
}

export interface SurveyChatResponse {
  session_id: string;
  ai_question: string | null;
  progress: SurveyProgress;
  status: SurveySessionStatus;
  recommendation_ready: boolean;
}

export interface SurveyResetRequest {
  session_id: string;
}

export interface SurveyResetResponse {
  message: string;
  reset: boolean;
}

export interface SurveyResultQuery {
  session_id: string;
  sort?: string;
  cursor?: string;
  page_size?: number;
}

export interface SurveyResultItem {
  game_id: number;
  name: string;
  genres: string[];
  thumbnail_url: string | null;
  rating: number | null;
  is_liked: boolean;
}

export interface SurveyResultResponse {
  session_id: string;
  user_id: number;
  count: number;
  next: string | null;
  results: SurveyResultItem[];
}

export const DEFAULT_SURVEY_PROGRESS: SurveyProgress = {
  current_step: 0,
  total_steps: 0,
  completion_rate: 0,
};
