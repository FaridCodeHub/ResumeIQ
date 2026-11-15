import type {
  ResumeAnalysis,
} from './analysis.schema.js';

// --------------------------------------------------
// Analysis types
// --------------------------------------------------

export type AnalysisType =
  | 'general'
  | 'job_specific';

export type AIProvider = 'gemini';

// --------------------------------------------------
// Analysis request
// --------------------------------------------------

export interface GeneralAnalysisRequest {
  analysisType: 'general';
  resumeId: string;
}

export interface JobSpecificAnalysisRequest {
  analysisType: 'job_specific';
  resumeId: string;
  jobId: string;
}

export type ResumeAnalysisRequest =
  | GeneralAnalysisRequest
  | JobSpecificAnalysisRequest;

// --------------------------------------------------
// AI configuration
// --------------------------------------------------

export interface AIConfiguration {
  provider: AIProvider;
  apiKey: string;
  model: string;
  source: 'user' | 'platform';
}

// --------------------------------------------------
// Gemini analysis input
// --------------------------------------------------

export interface GeminiAnalysisInput {
  resumeText: string;
  analysisType: AnalysisType;
  jobDescription?: string;
  jobTitle?: string;
  company?: string;
}

// --------------------------------------------------
// Analysis result
// --------------------------------------------------

export interface ResumeAnalysisResult {
  analysisId: string;
  resumeId: string;
  analysisType: AnalysisType;
  jobId: string | null;
  matchScore: number;
  result: ResumeAnalysis;
  createdAt: Date;
}

// --------------------------------------------------
// Scoring metadata
// --------------------------------------------------

export interface ScoringMetadata {
  overallScore: number;
  atsScore: number;
  keywordScore: number;
  formattingScore: number;
  structureScore: number;
  confidence: number;
}

// --------------------------------------------------
// AI usage metadata
// --------------------------------------------------

export interface AIUsageMetadata {
  provider: AIProvider;
  model: string;
  keySource: 'user' | 'platform';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestDurationMs: number;
}

// --------------------------------------------------
// Complete analysis execution result
// --------------------------------------------------

export interface AnalysisExecutionResult {
  analysis: ResumeAnalysis;
  scoring: ScoringMetadata;
  usage: AIUsageMetadata;
}