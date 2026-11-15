import Fuse from 'fuse.js';
import { pool } from '../../config/db.js';

// ==================================================
// TYPES
// ==================================================

export interface SkillCandidate {
  name: string;
  category?: string | null;
  description?: string | null;
  evidence?: string | null;
  confidence?: number;
}

export interface NormalizedSkill {
  skillId: string;
  skillName: string;
  category: string | null;
  matchedBy: 'canonical' | 'alias' | 'fuzzy';
  confidence: number;
  originalName: string;
  evidence: string | null;
}

export interface UnrecognizedSkill {
  originalName: string;
  normalizedName: string;
  category: string | null;
  description: string | null;
  evidence?: string | null;
  reason:
    | 'not_found'
    | 'ambiguous'
    | 'low_confidence';
  possibleMatches?: string[];
}

export interface InvalidSkillCandidate {
  index: number;
  receivedValue: unknown;
  reason:
    | 'invalid_candidate'
    | 'missing_name'
    | 'invalid_name_type'
    | 'empty_name'
    | 'name_too_long';
}

export interface SkillNormalizationResult {
  matchedSkills: NormalizedSkill[];
  unrecognizedSkills: UnrecognizedSkill[];
  invalidCandidates: InvalidSkillCandidate[];
}

interface CatalogSkill {
  skill_id: string;
  skill_name: string;
  category: string | null;
  normalized_name: string;
}

interface CatalogAlias {
  alias_id: string;
  skill_id: string;
  alias_name: string;
  normalized_alias: string;
  skill_name: string;
  category: string | null;
}

interface FuzzyCandidate {
  skillId: string;
  skillName: string;
  category: string | null;
  searchName: string;
  normalizedName: string;
}

// ==================================================
// CONFIGURATION
// ==================================================

const FUZZY_MATCH_THRESHOLD = 0.12;

const FUZZY_AMBIGUITY_MARGIN = 0.05;

// Minimum confidence required to accept a fuzzy match.
const MIN_FUZZY_CONFIDENCE = 0.90;

const MAX_CANDIDATES = 5;

const MAX_SKILLS_PER_REQUEST = 200;

// ==================================================
// NAME NORMALIZATION
// ==================================================

export function normalizeSkillName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_.-]+/g, '');
}

// ==================================================
// INPUT VALIDATION
// ==================================================

function validateCandidates(
  candidates: unknown,
): {
  valid: SkillCandidate[];
  invalid: InvalidSkillCandidate[];
} {
  if (!Array.isArray(candidates)) {
    throw new Error('Skills must be provided as an array.');
  }

  if (candidates.length > MAX_SKILLS_PER_REQUEST) {
    throw new Error(
      `Maximum ${MAX_SKILLS_PER_REQUEST} skills allowed per request.`,
    );
  }

  const valid: SkillCandidate[] = [];
  const invalid: InvalidSkillCandidate[] = [];

  candidates.forEach((candidate, index) => {
    if (
      !candidate ||
      typeof candidate !== 'object' ||
      Array.isArray(candidate)
    ) {
      invalid.push({
        index,
        receivedValue: candidate,
        reason: 'invalid_candidate',
      });
      return;
    }

    const item = candidate as Record<string, unknown>;

    if (!('name' in item)) {
      invalid.push({
        index,
        receivedValue: candidate,
        reason: 'missing_name',
      });
      return;
    }

    if (typeof item.name !== 'string') {
      invalid.push({
        index,
        receivedValue: candidate,
        reason: 'invalid_name_type',
      });
      return;
    }

    const name = item.name.trim();

    if (!name) {
      invalid.push({
        index,
        receivedValue: candidate,
        reason: 'empty_name',
      });
      return;
    }

    if (name.length > 150) {
      invalid.push({
        index,
        receivedValue: candidate,
        reason: 'name_too_long',
      });
      return;
    }

    valid.push({
      name,
      category:
        typeof item.category === 'string'
          ? item.category
          : null,
      description:
        typeof item.description === 'string'
          ? item.description
          : null,
      evidence:
        typeof item.evidence === 'string'
          ? item.evidence
          : null,
      confidence:
        typeof item.confidence === 'number' &&
        Number.isFinite(item.confidence)
          ? item.confidence
          : undefined,
    });
  });

  return { valid, invalid };
}

// ==================================================
// LOAD SKILL CATALOG
// ==================================================

async function loadSkillCatalog(): Promise<{
  skills: CatalogSkill[];
  aliases: CatalogAlias[];
}> {
  const [skillsResult, aliasesResult] = await Promise.all([
    pool.query<CatalogSkill>(
      `
        SELECT
          skill_id,
          skill_name,
          category,
          normalized_name
        FROM skills
        WHERE is_active = TRUE
      `,
    ),

    pool.query<CatalogAlias>(
      `
        SELECT
          sa.alias_id,
          sa.skill_id,
          sa.alias_name,
          sa.normalized_alias,
          s.skill_name,
          s.category
        FROM skill_aliases sa
        INNER JOIN skills s
          ON s.skill_id = sa.skill_id
        WHERE s.is_active = TRUE
      `,
    ),
  ]);

  return {
    skills: skillsResult.rows,
    aliases: aliasesResult.rows,
  };
}

// ==================================================
// FUZZY SEARCH INDEX
// ==================================================

function createFuzzyIndex(
  skills: CatalogSkill[],
  aliases: CatalogAlias[],
): Fuse<FuzzyCandidate> {
  const candidates: FuzzyCandidate[] = [];

  for (const skill of skills) {
    candidates.push({
      skillId: skill.skill_id,
      skillName: skill.skill_name,
      category: skill.category,
      searchName: skill.skill_name,
      normalizedName: skill.normalized_name,
    });
  }

  for (const alias of aliases) {
    candidates.push({
      skillId: alias.skill_id,
      skillName: alias.skill_name,
      category: alias.category,
      searchName: alias.alias_name,
      normalizedName: alias.normalized_alias,
    });
  }

  return new Fuse(candidates, {
    keys: ['normalizedName'],
    includeScore: true,
    threshold: FUZZY_MATCH_THRESHOLD,
    ignoreLocation: true,
    minMatchCharLength: 3,
    shouldSort: true,
  });
}

// ==================================================
// EXACT MATCHING
// ==================================================

function findExactCanonical(
  normalizedName: string,
  skills: CatalogSkill[],
): CatalogSkill | undefined {
  return skills.find(
    (skill) => skill.normalized_name === normalizedName,
  );
}

function findExactAlias(
  normalizedName: string,
  aliases: CatalogAlias[],
): CatalogAlias | undefined {
  return aliases.find(
    (alias) => alias.normalized_alias === normalizedName,
  );
}

// ==================================================
// FUZZY MATCHING
// ==================================================

function findFuzzyMatch(
  normalizedName: string,
  fuzzyIndex: Fuse<FuzzyCandidate>,
):
  | {
      skill: FuzzyCandidate;
      confidence: number;
      ambiguous: boolean;
      lowConfidence: boolean;
      possibleMatches: string[];
    }
  | undefined {
  if (normalizedName.length < 5) {
    return undefined;
  }

  const results = fuzzyIndex.search(normalizedName, {
    limit: MAX_CANDIDATES,
  });

  if (results.length === 0) {
    return undefined;
  }

  const grouped = new Map<
    string,
    {
      skill: FuzzyCandidate;
      score: number;
    }
  >();

  for (const result of results) {
    if (result.score === undefined) {
      continue;
    }

    const candidate = result.item;

    const existing = grouped.get(candidate.skillId);

    if (!existing || result.score < existing.score) {
      grouped.set(candidate.skillId, {
        skill: candidate,
        score: result.score,
      });
    }
  }

  const ranked = [...grouped.values()].sort(
    (a, b) => a.score - b.score,
  );

  const best = ranked[0];

  if (!best) {
    return undefined;
  }

  const confidence = Number(
    (1 - best.score).toFixed(3),
  );

  if (best.score > FUZZY_MATCH_THRESHOLD) {
    return undefined;
  }

  const secondBest = ranked[1];

    const ambiguous =
    secondBest !== undefined &&
    secondBest.score - best.score <
        FUZZY_AMBIGUITY_MARGIN;

const lowConfidence =
  confidence < MIN_FUZZY_CONFIDENCE;

  return {
    skill: best.skill,
    confidence,
    ambiguous,
    lowConfidence,
    possibleMatches: ranked
      .slice(0, 3)
      .map((item) => item.skill.skillName),
  };
}

// ==================================================
// SAVE UNKNOWN SKILLS FOR REVIEW
// ==================================================

async function saveUnknownSkills(
  skills: UnrecognizedSkill[],
): Promise<void> {
  if (skills.length === 0) {
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const skill of skills) {
      await client.query(
        `
          INSERT INTO skill_catalog_review (
            proposed_skill_name,
            normalized_name,
            category,
            description,
            source,
            status,
            review_reason,
            possible_matches,
            evidence
          )
          VALUES ($1, $2, $3, $4, 'ai', 'pending', $5, $6, $7)
          ON CONFLICT (normalized_name)
          DO UPDATE SET
            review_reason = EXCLUDED.review_reason,
            possible_matches = EXCLUDED.possible_matches,
            evidence = COALESCE(
              EXCLUDED.evidence,
              skill_catalog_review.evidence
            )
          WHERE skill_catalog_review.status = 'pending'
        `,
        [
          skill.originalName,
          skill.normalizedName,
          skill.category,
          skill.description,
          skill.reason,
          skill.possibleMatches ?? [],
          skill.evidence ?? null,
        ],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ==================================================
// MAIN NORMALIZATION SERVICE
// ==================================================

export async function normalizeSkills(
  candidates: SkillCandidate[],
): Promise<SkillNormalizationResult> {
  const validation = validateCandidates(candidates);

  const validatedCandidates = validation.valid;
  const invalidCandidates = validation.invalid;

  const { skills, aliases } =
    await loadSkillCatalog();

  const fuzzyIndex = createFuzzyIndex(
    skills,
    aliases,
  );

  const matchedSkills: NormalizedSkill[] = [];

  const unrecognizedSkills: UnrecognizedSkill[] = [];

  // Prevent processing the same input name twice.
  const processedNames = new Set<string>();

  // Prevent multiple names mapping to the same database skill.
  const processedSkillIds = new Set<string>();

  for (const candidate of validatedCandidates) {
    const originalName = candidate.name.trim();

    const normalizedName =
      normalizeSkillName(originalName);

    if (
      !normalizedName ||
      processedNames.has(normalizedName)
    ) {
      continue;
    }

    processedNames.add(normalizedName);

    // ----------------------------------------------
    // 1. EXACT CANONICAL MATCH
    // ----------------------------------------------

    const canonical = findExactCanonical(
      normalizedName,
      skills,
    );

    if (canonical) {
      if (processedSkillIds.has(canonical.skill_id)) {
        continue;
      }

      processedSkillIds.add(canonical.skill_id);

      matchedSkills.push({
        skillId: canonical.skill_id,
        skillName: canonical.skill_name,
        category: canonical.category,
        matchedBy: 'canonical',
        confidence: 1,
        originalName,
        evidence: candidate.evidence ?? null,
      });

      continue;
    }

    // ----------------------------------------------
    // 2. EXACT ALIAS MATCH
    // ----------------------------------------------

    const alias = findExactAlias(
      normalizedName,
      aliases,
    );

    if (alias) {
      if (processedSkillIds.has(alias.skill_id)) {
        continue;
      }

      processedSkillIds.add(alias.skill_id);

      matchedSkills.push({
        skillId: alias.skill_id,
        skillName: alias.skill_name,
        category: alias.category,
        matchedBy: 'alias',
        confidence: 1,
        originalName,
        evidence: candidate.evidence ?? null,
      });

      continue;
    }

    // ----------------------------------------------
    // 3. FUZZY MATCHING
    // ----------------------------------------------

    const fuzzy = findFuzzyMatch(
      normalizedName,
      fuzzyIndex,
    );

    if (fuzzy?.ambiguous || fuzzy?.lowConfidence) {
    unrecognizedSkills.push({
        originalName,
        normalizedName,
        category: candidate.category ?? null,
        description: candidate.description ?? null,
        evidence: candidate.evidence ?? null,
        reason: fuzzy.ambiguous
        ? 'ambiguous'
        : 'low_confidence',
        possibleMatches: fuzzy.possibleMatches,
    });

    continue;
    }

    if (fuzzy) {
      const skillId = fuzzy.skill.skillId;

      if (processedSkillIds.has(skillId)) {
        continue;
      }

      processedSkillIds.add(skillId);

      matchedSkills.push({
        skillId,
        skillName: fuzzy.skill.skillName,
        category: fuzzy.skill.category,
        matchedBy: 'fuzzy',
        confidence: fuzzy.confidence,
        originalName,
        evidence: candidate.evidence ?? null,
      });

      continue;
    }

    // ----------------------------------------------
    // 4. UNKNOWN SKILL
    // ----------------------------------------------

    unrecognizedSkills.push({
      originalName,
      normalizedName,
      category: candidate.category ?? null,
      description: candidate.description ?? null,
      evidence: candidate.evidence ?? null,
      reason: 'not_found',
    });
  }

  await saveUnknownSkills(unrecognizedSkills);

  return {
    matchedSkills,
    unrecognizedSkills,
    invalidCandidates,
  };
}