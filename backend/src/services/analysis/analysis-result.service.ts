import { pool } from '../../config/db.js';

export class AnalysisNotFoundError extends Error {
  statusCode: number;

  constructor() {
    super('Analysis not found.');
    this.name = 'AnalysisNotFoundError';
    this.statusCode = 404;
  }
}

interface AnalysisRow {
  analysis_id: string;
  user_id: string;
  resume_id: string;
  resume_title: string;
  analysis_type: 'general' | 'job_specific';
  job_id: string | null;
  job_title: string | null;
  company: string | null;
  match_score: string | number;
  overall_score: string | number;
  confidence_score: string | number;
  analysis_date: Date;
  result_json: Record<string, unknown> | null;
  ai_provider: string | null;
  ai_model: string | null;
  ai_key_source: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  request_duration_ms: number | null;
}

interface ATSRow {
  ats_score: string | number;
  keyword_score: string | number;
  formatting_score: string | number;
  structure_score: string | number;
  scoring_breakdown: Record<string, unknown> | null;
}

interface RecommendationRow {
  recommendation_id: string;
  recommendation_title: string | null;
  recommendation_text: string;
  priority: string;
  category: string | null;
  example: string | null;
}

interface CareerRecommendationRow {
  career_recommendation_id: string;
  career_title: string;
  match_percentage: string | number;
  reasoning: string | null;
  required_skills: unknown;
  missing_skills: unknown;
}

interface SkillGapRow {
  gap_id: string;
  skill_id: string;
  skill_name: string;
  category: string | null;
  reason: string | null;
  importance_level: string;
  learning_recommendation: string | null;
}

export async function getAnalysisResult(
  userId: string,
  analysisId: string,
) {
  if (!userId) {
    throw new Error('Authentication required.');
  }

  // Retrieve the analysis only if it belongs to this user.
  const analysisResult = await pool.query<AnalysisRow>(
    `SELECT
       a.analysis_id,
       a.user_id,
       a.resume_id,
       r.resume_title,
       a.analysis_type,
       a.job_id,
       jd.job_title,
       jd.company,
       a.match_score,
       a.overall_score,
       a.confidence_score,
       a.analysis_date,
       a.result_json,
       a.ai_provider,
       a.ai_model,
       a.ai_key_source,
       a.input_tokens,
       a.output_tokens,
       a.total_tokens,
       a.request_duration_ms
     FROM analysis a
     INNER JOIN resumes r
       ON r.resume_id = a.resume_id
     LEFT JOIN job_descriptions jd
       ON jd.job_id = a.job_id
     WHERE a.analysis_id = $1
       AND a.user_id = $2
     LIMIT 1`,
    [analysisId, userId],
  );

  const analysis = analysisResult.rows[0];

  if (!analysis) {
    throw new AnalysisNotFoundError();
  }

  // Retrieve related records in parallel.
  const [
    atsResult,
    recommendationsResult,
    careerResult,
    skillGapsResult,
  ] = await Promise.all([
    pool.query<ATSRow>(
      `SELECT
         ats_score,
         keyword_score,
         formatting_score,
         structure_score,
         scoring_breakdown
       FROM ats_analysis
       WHERE analysis_id = $1`,
      [analysisId],
    ),

    pool.query<RecommendationRow>(
      `SELECT
         recommendation_id,
         recommendation_title,
         recommendation_text,
         priority,
         category,
         example
       FROM recommendations
       WHERE analysis_id = $1
       ORDER BY
         CASE priority
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'low' THEN 3
         END,
         recommendation_id`,
      [analysisId],
    ),

    pool.query<CareerRecommendationRow>(
      `SELECT
         career_recommendation_id,
         career_title,
         match_percentage,
         reasoning,
         required_skills,
         missing_skills
       FROM career_recommendations
       WHERE analysis_id = $1
       ORDER BY match_percentage DESC`,
      [analysisId],
    ),

    pool.query<SkillGapRow>(
      `SELECT
         sg.gap_id,
         sg.skill_id,
         s.skill_name,
         s.category,
         sg.reason,
         sg.importance_level,
         sg.learning_recommendation
       FROM skill_gaps sg
       INNER JOIN skills s
         ON s.skill_id = sg.skill_id
       WHERE sg.analysis_id = $1
       ORDER BY
         CASE sg.importance_level
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'low' THEN 3
         END,
         s.skill_name`,
      [analysisId],
    ),
  ]);

  const ats = atsResult.rows[0];

  return {
    analysisId: analysis.analysis_id,
    resumeId: analysis.resume_id,
    resumeTitle: analysis.resume_title,

    analysisType: analysis.analysis_type,
    jobId: analysis.job_id,
    job: analysis.job_id
      ? {
          jobTitle: analysis.job_title,
          company: analysis.company,
        }
      : null,

    scores: {
      overallScore: Number(analysis.overall_score),
      matchScore: Number(analysis.match_score),
      confidenceScore: Number(analysis.confidence_score),

      ats: ats
        ? {
            atsScore: Number(ats.ats_score),
            keywordScore: Number(ats.keyword_score),
            formattingScore: Number(ats.formatting_score),
            structureScore: Number(ats.structure_score),
            scoringBreakdown: ats.scoring_breakdown,
          }
        : null,
    },

    result: analysis.result_json,

    recommendations: recommendationsResult.rows.map((row) => ({
      recommendationId: row.recommendation_id,
      title: row.recommendation_title,
      description: row.recommendation_text,
      priority: row.priority,
      category: row.category,
      example: row.example,
    })),

    careerRecommendations: careerResult.rows.map((row) => ({
      careerRecommendationId: row.career_recommendation_id,
      careerTitle: row.career_title,
      matchPercentage: Number(row.match_percentage),
      reasoning: row.reasoning,
      requiredSkills: row.required_skills,
      missingSkills: row.missing_skills,
    })),

    skillGaps: skillGapsResult.rows.map((row) => ({
      gapId: row.gap_id,
      skillId: row.skill_id,
      skillName: row.skill_name,
      category: row.category,
      reason: row.reason,
      importanceLevel: row.importance_level,
      learningRecommendation: row.learning_recommendation,
    })),

    aiUsage: {
      provider: analysis.ai_provider,
      model: analysis.ai_model,
      keySource: analysis.ai_key_source,
      inputTokens: analysis.input_tokens,
      outputTokens: analysis.output_tokens,
      totalTokens: analysis.total_tokens,
      requestDurationMs: analysis.request_duration_ms,
    },

    createdAt: analysis.analysis_date,
  };
}

/*
Check ownership of analysis data
WHERE a.analysis_id = $1
  AND a.user_id = $2
*/