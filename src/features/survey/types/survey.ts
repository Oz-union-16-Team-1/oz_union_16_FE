import type { RecommendationResultItemShape } from '../../recommendation/types';

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
  is_reset?: boolean;
}

export interface SurveyApiSessionStartRequest {
  is_reset?: boolean;
}

export interface SurveyApiChatRequest {
  user_answer: string;
}

export interface SurveyApiProgress {
  current_step?: number | null;
  total_steps?: number | null;
  completion_rate?: number | null;
}

export interface SurveyApiLegacySessionResponseFields {
  chatbot_reply?: string | null;
  progress_rate?: number | null;
  is_completed?: boolean | null;
}

export type SurveyApiSessionResponse = SurveyApiLegacySessionResponseFields & {
  session_id: string;
  ai_question?: string | null;
  progress?: SurveyApiProgress | null;
  recommendation_ready?: boolean | null;
  status?: SurveySessionStatus | null;
};

export interface SurveyApiResetResponse extends SurveyApiSessionResponse {
  message: string;
}

export interface SurveyChatRequest {
  session_id: string;
  user_answer: string;
}

export interface SurveySessionResponse {
  session_id: string;
  assistant_message: string | null;
  progress: SurveyProgress;
  status: SurveySessionStatus;
  recommendation_ready: boolean;
}

export type SurveySessionStartResponse = SurveySessionResponse;

export type SurveyChatResponse = SurveySessionResponse;

export interface SurveyResetRequest {
  session_id: string;
}

export interface SurveyResetResponse {
  message: string;
  session_id: string;
  assistant_message: string | null;
  progress: SurveyProgress;
  status: SurveySessionStatus;
  recommendation_ready: boolean;
}

export interface SurveyResultQuery {
  sort?: string;
  cursor?: string;
  page_size?: number;
  session_id?: string;
}

export interface SurveyApiResultItem {
  game_id: number;
  title?: string | null;
  name?: string | null;
  genres: string[];
  thumbnail_url: string | null;
  rating: number | null;
  is_liked: boolean;
}

export type SurveyResultItem = RecommendationResultItemShape;

export interface SurveyApiResultResponse {
  session_id?: string;
  user_id?: number;
  count?: number | null;
  next?: string | null;
  results: SurveyApiResultItem[];
}

export interface SurveyResultResponse {
  session_id?: string;
  user_id?: number;
  count: number;
  next: string | null;
  results: SurveyResultItem[];
}

export const DEFAULT_SURVEY_PROGRESS: SurveyProgress = {
  current_step: 0,
  total_steps: 0,
  completion_rate: 0,
};
