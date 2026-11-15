import type {
  ResumeAnalysis,
} from './analysis.schema.js';

import type {
  ScoringMetadata,
} from './analysis.types.js';

// --------------------------------------------------
// Scoring configuration
// --------------------------------------------------

const SCORE_WEIGHTS = {
  contentQuality: 0.20,
  readability: 0.10,
  experiencePresentation: 0.15,
  skillsPresentation: 0.15,
  educationPresentation: 0.10,
  impactAndAchievements: 0.15,
  formatting: 0.15,
} as const;

// --------------------------------------------------
// Utility functions
// --------------------------------------------------

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

function calculateWeightedScore(
  scores: Record<string, number>,
  weights: Record<string, number>,
): number {
  let weightedTotal = 0;
  let availableWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const score = scores[key];

    if (typeof score !== 'number' || !Number.isFinite(score)) {
      continue;
    }

    weightedTotal += clampScore(score) * weight;
    availableWeight += weight;
  }

  if (availableWeight === 0) {
    return 0;
  }

  return Number(
    (weightedTotal / availableWeight).toFixed(2),
  );
}

function roundScore(score: number): number {
  return Number(clampScore(score).toFixed(2));
}

// --------------------------------------------------
// Resume quality scoring
// --------------------------------------------------

export function calculateResumeQualityScore(
  analysis: ResumeAnalysis,
): number {
  const breakdown = analysis.resumeQuality.breakdown;

  const scores = {
    contentQuality: breakdown.contentQuality,
    readability: breakdown.readability,
    experiencePresentation: breakdown.experiencePresentation,
    skillsPresentation: breakdown.skillsPresentation,
    educationPresentation: breakdown.educationPresentation,
    impactAndAchievements: breakdown.impactAndAchievements,
    formatting: breakdown.formatting,
  };

  return roundScore(
    calculateWeightedScore(
      scores,
      SCORE_WEIGHTS,
    ),
  );
}

// --------------------------------------------------
// ATS scoring
// --------------------------------------------------

export function calculateATSScore(
  analysis: ResumeAnalysis,
): number {
  const ats = analysis.atsAnalysis;

  const scores = {
    keyword: ats.keywordScore,
    formatting: ats.formattingScore,
    structure: ats.structureScore,
  };

  const weights = {
    keyword: 0.40,
    formatting: 0.30,
    structure: 0.30,
  };

  return roundScore(
    calculateWeightedScore(scores, weights),
  );
}

// --------------------------------------------------
// Job-specific skill matching
// --------------------------------------------------

export interface JobSkillInput {
  requiredSkills: string[];
  preferredSkills: string[];
  resumeSkills: string[];
}

export interface JobMatchScore {
  overallScore: number;
  requiredSkillScore: number;
  preferredSkillScore: number;
  matchingRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchingPreferredSkills: string[];
  missingPreferredSkills: string[];
}

function normalizeSkill(skill: string): string {
  return skill
    .toLowerCase()
    .trim()
    .replace(/[.\s_-]+/g, '');
}

export function calculateJobMatchScore(
  input: JobSkillInput,
): JobMatchScore {
  const resumeSkillSet = new Set(
    input.resumeSkills.map(normalizeSkill),
  );

  const requiredSkills = [
    ...new Set(input.requiredSkills),
  ];

  const preferredSkills = [
    ...new Set(input.preferredSkills),
  ];

  const matchingRequiredSkills =
    requiredSkills.filter((skill) =>
      resumeSkillSet.has(normalizeSkill(skill)),
    );

  const missingRequiredSkills =
    requiredSkills.filter((skill) =>
      !resumeSkillSet.has(normalizeSkill(skill)),
    );

  const matchingPreferredSkills =
    preferredSkills.filter((skill) =>
      resumeSkillSet.has(normalizeSkill(skill)),
    );

  const missingPreferredSkills =
    preferredSkills.filter((skill) =>
      !resumeSkillSet.has(normalizeSkill(skill)),
    );

  const requiredSkillScore =
    requiredSkills.length > 0
      ? (matchingRequiredSkills.length /
          requiredSkills.length) *
        100
      : 100;

  const preferredSkillScore =
    preferredSkills.length > 0
      ? (matchingPreferredSkills.length /
          preferredSkills.length) *
        100
      : 100;

  const overallScore =
    requiredSkills.length > 0
      ? requiredSkillScore * 0.75 +
        preferredSkillScore * 0.25
      : preferredSkillScore;

  return {
    overallScore: roundScore(overallScore),

    requiredSkillScore: roundScore(
      requiredSkillScore,
    ),

    preferredSkillScore: roundScore(
      preferredSkillScore,
    ),

    matchingRequiredSkills,
    missingRequiredSkills,
    matchingPreferredSkills,
    missingPreferredSkills,
  };
}

// --------------------------------------------------
// Complete scoring metadata
// --------------------------------------------------

export function calculateScoringMetadata(
  analysis: ResumeAnalysis,
): ScoringMetadata {
  const overallScore =
    calculateResumeQualityScore(analysis);

  const atsScore =
    calculateATSScore(analysis);

  return {
    overallScore,
    atsScore,

    keywordScore: roundScore(
      analysis.atsAnalysis.keywordScore,
    ),

    formattingScore: roundScore(
      analysis.atsAnalysis.formattingScore,
    ),

    structureScore: roundScore(
      analysis.atsAnalysis.structureScore,
    ),

    // This is a placeholder until evidence-based
    // confidence calculation is implemented.
    confidence: 0,
  };
}