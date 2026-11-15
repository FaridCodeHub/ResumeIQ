import { pool } from '../../config/db.js';
import { AnalysisServiceError } from './analysis-orchestrator.service.js';

export interface AnalysisHistoryItem {
  analysisId: string;
  resumeId: string;
  resumeTitle: string;
  analysisType: 'general' | 'job_specific';
  jobId: string | null;
  overallScore: number;
  atsScore: number;
  matchScore: number;
  createdAt: Date;
}

interface AnalysisHistoryRow {
  analysis_id: string;
  resume_id: string;
  resume_title: string;
  analysis_type: 'general' | 'job_specific';
  job_id: string | null;
  overall_score: string | number;
  ats_score: string | number;
  match_score: string | number;
  analysis_date: Date;
}

export interface AnalysisHistoryResult {
  analyses: AnalysisHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getAnalysisHistory(
  userId: string,
  requestedPage = 1,
  requestedLimit = 10,
): Promise<AnalysisHistoryResult> {
  if (!userId) {
    throw new AnalysisServiceError(
      'Authentication required.',
      401,
    );
  }

  const page = Math.max(1, Math.floor(requestedPage));
  const limit = Math.min(
    50,
    Math.max(1, Math.floor(requestedLimit)),
  );

  const offset = (page - 1) * limit;

  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total
     FROM analysis
     WHERE user_id = $1`,
    [userId],
  );

  const total = Number(countResult.rows[0]?.total ?? 0);

  const historyResult = await pool.query<AnalysisHistoryRow>(
    `SELECT
       a.analysis_id,
       a.resume_id,
       r.resume_title,
       a.analysis_type,
       a.job_id,
       a.overall_score,
       COALESCE(aa.ats_score, 0) AS ats_score,
       a.match_score,
       a.analysis_date
     FROM analysis a
     INNER JOIN resumes r
       ON r.resume_id = a.resume_id
     LEFT JOIN ats_analysis aa
       ON aa.analysis_id = a.analysis_id
     WHERE a.user_id = $1
     ORDER BY a.analysis_date DESC, a.analysis_id DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  const analyses: AnalysisHistoryItem[] =
    historyResult.rows.map((row) => ({
      analysisId: row.analysis_id,
      resumeId: row.resume_id,
      resumeTitle: row.resume_title,
      analysisType: row.analysis_type,
      jobId: row.job_id,
      overallScore: Number(row.overall_score),
      atsScore: Number(row.ats_score),
      matchScore: Number(row.match_score),
      createdAt: row.analysis_date,
    }));

  return {
    analyses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/*

## Analysis History Service
- ✅ Retrieves only analyses belonging to the authenticated user.
- ✅ Includes the resume title.
- ✅ Retrieves ATS scores from `ats_analysis`.
- ✅ Sorts analyses by newest first.
- ✅ Supports pagination.
- ✅ Limits each page to a maximum of 50 records.
- ✅ Does not call Gemini.

*/