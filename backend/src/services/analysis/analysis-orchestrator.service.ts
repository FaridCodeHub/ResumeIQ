import { pool } from '../../config/db.js';

import type {
  ResumeAnalysis,
  ExtractedSkill,
} from './analysis.schema.js';

import type {
  ResumeAnalysisRequest,
  ResumeAnalysisResult,
  GeminiAnalysisInput,
} from './analysis.types.js';

import {
  preprocessResumeText,
} from './text-preprocessing.service.js';

import {
  resolveAIConfiguration,
} from './ai-configuration.service.js';

import {
  generateResumeAnalysis,
} from './gemini-analysis.service.js';

import {
  normalizeSkills,
  normalizeSkillName,
  type SkillCandidate,
} from './skill-normalization.service.js';

import {
  calculateScoringMetadata,
  calculateJobMatchScore,
} from './scoring.service.js';

// ==================================================
// TYPES
// ==================================================

interface ResumeRecord {
  resume_id: string;
  resume_title: string;
  extracted_text: string | null;
}

interface JobRecord {
  job_id: string;
  job_title: string;
  company: string | null;
  description: string;
}

interface JobSkillRecord {
  skill_id: string;
  skill_name: string;
  requirement_type: string;
}

interface StoredAnalysisRecord {
  analysis_id: string;
  analysis_date: Date;
}

// ==================================================
// SERVICE ERROR
// ==================================================

export class AnalysisServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AnalysisServiceError';
  }
}

// ==================================================
// VALIDATION
// ==================================================

function validateRequest(
  request: ResumeAnalysisRequest,
): void {
  if (!request.resumeId) {
    throw new AnalysisServiceError(
      'Resume ID is required.',
    );
  }

  if (
    request.analysisType !== 'general' &&
    request.analysisType !== 'job_specific'
  ) {
    throw new AnalysisServiceError(
      'Invalid analysis type.',
    );
  }

  if (
    request.analysisType === 'job_specific' &&
    !request.jobId
  ) {
    throw new AnalysisServiceError(
      'Job ID is required for job-specific analysis.',
    );
  }
}

// ==================================================
// LOAD RESUME
// ==================================================

async function getOwnedResume(
  userId: string,
  resumeId: string,
): Promise<ResumeRecord> {
  const result = await pool.query<ResumeRecord>(
    `
      SELECT
        resume_id,
        resume_title,
        extracted_text
      FROM resumes
      WHERE resume_id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [resumeId, userId],
  );

  if (result.rows.length === 0) {
    throw new AnalysisServiceError(
      'Resume not found or you do not have permission to access it.',
      404,
    );
  }

    const resume = result.rows[0];

    if (!resume) {
    throw new AnalysisServiceError(
        'Resume not found or you do not have permission to access it.',
        404,
    );
    }

  if (!resume.extracted_text?.trim()) {
    throw new AnalysisServiceError(
      'No extracted text is available for this resume. Please upload the resume again.',
    );
  }

  return resume;
}

// ==================================================
// LOAD JOB DESCRIPTION
// ==================================================

async function getJobDescription(
  userId: string,
  jobId: string,
): Promise<JobRecord> {
  const result = await pool.query<JobRecord>(
    `
      SELECT
        job_id,
        job_title,
        company,
        description
      FROM job_descriptions
      WHERE job_id = $1
        AND (
          visibility = 'public'
          OR user_id = $2
        )
      LIMIT 1
    `,
    [jobId, userId],
  );

  if (result.rows.length === 0) {
    throw new AnalysisServiceError(
      'Job description not found or you do not have permission to access it.',
      404,
    );
  }

  const job = result.rows[0];

  if (!job) {
    throw new AnalysisServiceError(
      'Job description not found or you do not have permission to access it.',
      404,
    );
  }

  return job;
}

// ==================================================
// LOAD JOB SKILLS
// ==================================================

async function getJobSkills(
  jobId: string,
): Promise<{
  requiredSkills: JobSkillRecord[];
  preferredSkills: JobSkillRecord[];
}> {
  const result = await pool.query<JobSkillRecord>(
    `
      SELECT
        s.skill_id,
        s.skill_name,
        js.requirement_type
      FROM job_skills js
      INNER JOIN skills s
        ON s.skill_id = js.skill_id
      WHERE js.job_id = $1
        AND s.is_active = TRUE
      ORDER BY s.skill_name
    `,
    [jobId],
  );

  const requiredSkills: JobSkillRecord[] = [];
  const preferredSkills: JobSkillRecord[] = [];

  for (const skill of result.rows) {
    const requirementType =
      skill.requirement_type.trim().toLowerCase();

    if (requirementType === 'required') {
      requiredSkills.push(skill);
    } else if (requirementType === 'preferred') {
      preferredSkills.push(skill);
    } else {
      throw new AnalysisServiceError(
        `Unsupported job skill requirement type: ${skill.requirement_type}`,
        500,
      );
    }
  }

  if (
    requiredSkills.length === 0 &&
    preferredSkills.length === 0
  ) {
    throw new AnalysisServiceError(
      'This job does not have any configured skill requirements yet.',
    );
  }

  return {
    requiredSkills,
    preferredSkills,
  };
}

// ==================================================
// MAP AI SKILLS TO NORMALIZATION INPUT
// ==================================================

function getSkillCandidates(
  analysis: ResumeAnalysis,
): SkillCandidate[] {
  const skills = [
    ...analysis.technicalSkills,
    ...analysis.softSkills,
  ];

  return skills.map((skill: ExtractedSkill) => ({
    name: skill.name,
    category: skill.category,
    evidence: skill.evidence,
    confidence: skill.confidence,
  }));
}

// ==================================================
// PRESERVE SKILL PROFICIENCY
// ==================================================

function getSkillProficiency(
  skill: {
    originalName: string;
  },
  candidates: SkillCandidate[],
): string {
  const normalizedOriginalName =
    normalizeSkillName(skill.originalName);

  const candidate = candidates.find(
    (item) =>
      normalizeSkillName(item.name) ===
      normalizedOriginalName,
  );

  return candidate?.name
    ? (
        (
          [
            ...[],
          ] as string[]
        ).length
          ? 'unknown'
          : 'unknown'
      )
    : 'unknown';
}

// ==================================================
// PERSIST ANALYSIS
// ==================================================

async function persistAnalysis(
  userId: string,
  resumeId: string,
  request: ResumeAnalysisRequest,
  analysis: ResumeAnalysis,
  scoring: ReturnType<typeof calculateScoringMetadata>,
  usage: {
    provider: string;
    model: string;
    keySource: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    requestDurationMs: number;
  },
  normalizedSkills: Awaited<
    ReturnType<typeof normalizeSkills>
  >,
  jobSkills: {
    requiredSkills: JobSkillRecord[];
    preferredSkills: JobSkillRecord[];
  } | null,
): Promise<StoredAnalysisRecord> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ----------------------------------------------
    // 1. CALCULATE JOB MATCH
    // ----------------------------------------------

    let matchScore = 0;

    let jobMatchResult:
      | ReturnType<typeof calculateJobMatchScore>
      | null = null;

    if (jobSkills) {
      const resumeSkillNames =
        normalizedSkills.matchedSkills.map(
          (skill) => skill.skillName,
        );

      jobMatchResult = calculateJobMatchScore({
        requiredSkills: jobSkills.requiredSkills.map(
          (skill) => skill.skill_name,
        ),

        preferredSkills: jobSkills.preferredSkills.map(
          (skill) => skill.skill_name,
        ),

        resumeSkills: resumeSkillNames,
      });

      matchScore = jobMatchResult.overallScore;

      if (!analysis.jobMatch) {
        throw new AnalysisServiceError(
          'AI did not return the required job matching information.',
        );
      }

      // Use the deterministic database skill match score.
      analysis.jobMatch.matchPercentage = matchScore;

      analysis.jobMatch.matchingSkills = [
        ...jobMatchResult.matchingRequiredSkills,
        ...jobMatchResult.matchingPreferredSkills,
      ];

      analysis.jobMatch.missingSkills = [
        ...jobMatchResult.missingRequiredSkills,
      ];

      analysis.jobMatch.preferredSkills = [
        ...jobMatchResult.matchingPreferredSkills,
      ];
    }

    // ----------------------------------------------
    // 2. INSERT MAIN ANALYSIS
    // ----------------------------------------------

    const analysisResult =
      await client.query<StoredAnalysisRecord>(
        `
          INSERT INTO analysis (
            user_id,
            resume_id,
            job_id,
            match_score,
            analysis_type,
            overall_score,
            confidence_score,
            result_json,
            ai_provider,
            ai_model,
            ai_key_source,
            input_tokens,
            output_tokens,
            total_tokens,
            request_duration_ms
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15
          )
          RETURNING analysis_id, analysis_date
        `,
        [
          userId,
          resumeId,
          request.analysisType === 'job_specific'
            ? request.jobId
            : null,
          matchScore,
          request.analysisType,
          scoring.overallScore,
          scoring.confidence,
          JSON.stringify(analysis),
          usage.provider,
          usage.model,
          usage.keySource,
          usage.inputTokens,
          usage.outputTokens,
          usage.totalTokens,
          usage.requestDurationMs,
        ],
      );

    const savedAnalysis = analysisResult.rows[0];

    if (!savedAnalysis) {
    throw new Error(
        'Failed to create the analysis record.',
    );
    }

    const analysisId = savedAnalysis.analysis_id;

    // ----------------------------------------------
    // 3. INSERT ATS ANALYSIS
    // ----------------------------------------------

    await client.query(
      `
        INSERT INTO ats_analysis (
          analysis_id,
          ats_score,
          keyword_score,
          formatting_score,
          structure_score,
          scoring_breakdown
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        analysisId,
        scoring.atsScore,
        scoring.keywordScore,
        scoring.formattingScore,
        scoring.structureScore,
        JSON.stringify({
          resumeQuality: analysis.resumeQuality.breakdown,
          parsingRisk: analysis.atsAnalysis.parsingRisk,
          issues: analysis.atsAnalysis.issues,
        }),
      ],
    );

    // ----------------------------------------------
    // 4. INSERT RECOMMENDATIONS
    // ----------------------------------------------

    for (const recommendation of analysis.recommendations) {
      await client.query(
        `
          INSERT INTO recommendations (
            analysis_id,
            recommendation_text,
            priority,
            recommendation_title,
            category,
            example
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          analysisId,
          recommendation.description,
          recommendation.priority,
          recommendation.title,
          recommendation.category,
          recommendation.example,
        ],
      );
    }

    // ----------------------------------------------
    // 5. INSERT CAREER RECOMMENDATIONS
    // ----------------------------------------------

    for (const career of analysis.careerRecommendations) {
      await client.query(
        `
          INSERT INTO career_recommendations (
            analysis_id,
            career_title,
            match_percentage,
            reasoning,
            required_skills,
            missing_skills
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          analysisId,
          career.careerTitle,
          career.matchPercentage,
          career.reasoning,
          JSON.stringify(career.requiredSkills),
          JSON.stringify(career.missingSkills),
        ],
      );
    }

    // ----------------------------------------------
    // 6. INSERT RECOGNIZED RESUME SKILLS
    // ----------------------------------------------

    const candidateMap = new Map(
      [
        ...analysis.technicalSkills,
        ...analysis.softSkills,
      ].map((skill) => [
        normalizeSkillName(skill.name),
        skill,
      ]),
    );

    for (const skill of normalizedSkills.matchedSkills) {
      const originalCandidate = candidateMap.get(
        normalizeSkillName(skill.originalName),
      );

      const proficiency =
        originalCandidate?.proficiency ?? 'unknown';

      await client.query(
        `
          INSERT INTO resume_skills (
            resume_id,
            skill_id,
            proficiency
          )
          VALUES ($1, $2, $3)
          ON CONFLICT (resume_id, skill_id)
          DO UPDATE SET
            proficiency = EXCLUDED.proficiency
        `,
        [
          resumeId,
          skill.skillId,
          proficiency,
        ],
      );
    }

    // ----------------------------------------------
    // 7. INSERT REQUIRED SKILL GAPS
    // ----------------------------------------------

    if (jobMatchResult && jobSkills) {
      const missingRequiredNames = new Set(
        jobMatchResult.missingRequiredSkills.map(
          normalizeSkillName,
        ),
      );

      const missingRequiredSkills =
        jobSkills.requiredSkills.filter(
          (skill) =>
            missingRequiredNames.has(
              normalizeSkillName(skill.skill_name),
            ),
        );

      for (const skill of missingRequiredSkills) {
        await client.query(
          `
            INSERT INTO skill_gaps (
              analysis_id,
              skill_id,
              reason,
              importance_level,
              learning_recommendation
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (analysis_id, skill_id)
            DO NOTHING
          `,
          [
            analysisId,
            skill.skill_id,
            'This skill is required by the selected job but was not identified in the resume.',
            'high',
            null,
          ],
        );
      }
    }

    await client.query('COMMIT');

    return savedAnalysis;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ==================================================
// MAIN ORCHESTRATOR
// ==================================================

export async function executeResumeAnalysis(
  userId: string,
  request: ResumeAnalysisRequest,
): Promise<ResumeAnalysisResult> {
  if (!userId) {
    throw new AnalysisServiceError(
      'Authenticated user ID is required.',
      401,
    );
  }

  validateRequest(request);

  // ----------------------------------------------
  // 1. LOAD OWNED RESUME
  // ----------------------------------------------

  const resume = await getOwnedResume(
    userId,
    request.resumeId,
  );

  // ----------------------------------------------
  // 2. PREPROCESS RESUME TEXT
  // ----------------------------------------------

  const processedText = preprocessResumeText(
    resume.extracted_text!,
  );

  // ----------------------------------------------
  // 3. LOAD JOB INFORMATION
  // ----------------------------------------------

  let job: JobRecord | null = null;

  let jobSkills: {
    requiredSkills: JobSkillRecord[];
    preferredSkills: JobSkillRecord[];
  } | null = null;

  if (request.analysisType === 'job_specific') {
    job = await getJobDescription(userId, request.jobId);

    jobSkills = await getJobSkills(request.jobId);
  }

  // ----------------------------------------------
  // 4. RESOLVE AI CONFIGURATION
  // ----------------------------------------------

  const configuration =
    await resolveAIConfiguration(userId);

  // ----------------------------------------------
  // 5. PREPARE GEMINI INPUT
  // ----------------------------------------------

  const geminiInput: GeminiAnalysisInput = {
    resumeText: processedText.normalizedText,
    analysisType: request.analysisType,
    ...(job
      ? {
          jobTitle: job.job_title,
          company: job.company ?? undefined,
          jobDescription: job.description,
        }
      : {}),
  };

  // ----------------------------------------------
  // 6. GENERATE AI ANALYSIS
  // ----------------------------------------------

  const geminiResult = await generateResumeAnalysis(
    geminiInput,
    configuration,
  );

  const analysis = geminiResult.analysis;

  // ----------------------------------------------
  // 7. CALCULATE SCORES
  // ----------------------------------------------

  const scoring =
    calculateScoringMetadata(analysis);

  // ----------------------------------------------
  // 8. NORMALIZE RESUME SKILLS
  // ----------------------------------------------

  const skillCandidates =
    getSkillCandidates(analysis);

  const normalizedSkills = await normalizeSkills(
    skillCandidates,
  );

  // ----------------------------------------------
  // 9. PERSIST EVERYTHING
  // ----------------------------------------------

  const savedAnalysis = await persistAnalysis(
    userId,
    request.resumeId,
    request,
    analysis,
    scoring,
    geminiResult.usage,
    normalizedSkills,
    jobSkills,
  );

  // ----------------------------------------------
  // 10. RETURN RESULT
  // ----------------------------------------------

  return {
    analysisId: savedAnalysis.analysis_id,
    resumeId: request.resumeId,
    analysisType: request.analysisType,
    jobId:
      request.analysisType === 'job_specific'
        ? request.jobId
        : null,
    matchScore:
      request.analysisType === 'job_specific'
        ? analysis.jobMatch?.matchPercentage ?? 0
        : 0,
    result: analysis,
    createdAt: savedAnalysis.analysis_date,
  };
}