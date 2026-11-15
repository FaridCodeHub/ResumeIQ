import { z } from 'zod';

// --------------------------------------------------
// Reusable schemas
// --------------------------------------------------

const textSchema = z.string().trim().min(1);

const percentageSchema = z
  .number()
  .min(0)
  .max(100);

const confidenceSchema = z
  .number()
  .min(0)
  .max(1);

// --------------------------------------------------
// Personal information
// --------------------------------------------------

const personalInformationSchema = z.object({
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  githubUrl: z.string().nullable(),
  portfolioUrl: z.string().nullable(),
});

// --------------------------------------------------
// Skills
// --------------------------------------------------

const skillSchema = z.object({
  name: textSchema,
  category: z.enum([
    'technical',
    'soft',
    'language',
    'tool',
    'domain',
    'other',
  ]),
  proficiency: z.enum([
    'beginner',
    'intermediate',
    'advanced',
    'expert',
    'unknown',
  ]),
  evidence: z.string().nullable(),
  confidence: confidenceSchema,
});

// --------------------------------------------------
// Work experience
// --------------------------------------------------

const workExperienceSchema = z.object({
  jobTitle: textSchema,
  company: z.string().nullable(),
  location: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isCurrent: z.boolean(),
  responsibilities: z.array(textSchema),
  achievements: z.array(textSchema),
  technologies: z.array(textSchema),
});

// --------------------------------------------------
// Education
// --------------------------------------------------

const educationSchema = z.object({
  institution: textSchema,
  degree: z.string().nullable(),
  fieldOfStudy: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  grade: z.string().nullable(),
});

// --------------------------------------------------
// Projects
// --------------------------------------------------

const projectSchema = z.object({
  name: textSchema,
  description: z.string().nullable(),
  technologies: z.array(textSchema),
  role: z.string().nullable(),
  projectUrl: z.string().nullable(),
});

// --------------------------------------------------
// Certifications
// --------------------------------------------------

const certificationSchema = z.object({
  name: textSchema,
  issuingOrganization: z.string().nullable(),
  issueDate: z.string().nullable(),
  expirationDate: z.string().nullable(),
  credentialUrl: z.string().nullable(),
});

// --------------------------------------------------
// Professional summary
// --------------------------------------------------

const professionalSummarySchema = z.object({
  summary: z.string(),
  seniorityLevel: z.enum([
    'student',
    'entry_level',
    'junior',
    'mid_level',
    'senior',
    'executive',
    'unknown',
  ]),
  estimatedYearsOfExperience: z.number().min(0),
  primaryIndustry: z.string().nullable(),
  primaryRole: z.string().nullable(),
});

// --------------------------------------------------
// Resume quality evaluation
// --------------------------------------------------

const scoreBreakdownSchema = z.object({
  contentQuality: percentageSchema,
  formatting: percentageSchema,
  readability: percentageSchema,
  experiencePresentation: percentageSchema,
  skillsPresentation: percentageSchema,
  educationPresentation: percentageSchema,
  impactAndAchievements: percentageSchema,
});

const resumeQualitySchema = z.object({
  overallScore: percentageSchema,
  breakdown: scoreBreakdownSchema,
  strengths: z.array(textSchema),
  weaknesses: z.array(textSchema),
  explanation: textSchema,
});

// --------------------------------------------------
// ATS evaluation
// --------------------------------------------------

const atsAnalysisSchema = z.object({
  atsScore: percentageSchema,
  keywordScore: percentageSchema,
  formattingScore: percentageSchema,
  structureScore: percentageSchema,
  parsingRisk: z.enum([
    'low',
    'medium',
    'high',
  ]),
  issues: z.array(
    z.object({
      issue: textSchema,
      severity: z.enum([
        'low',
        'medium',
        'high',
      ]),
      explanation: textSchema,
      recommendation: textSchema,
    }),
  ),
});

// --------------------------------------------------
// Improvement recommendations
// --------------------------------------------------

const recommendationSchema = z.object({
  title: textSchema,
  description: textSchema,
  priority: z.enum([
    'low',
    'medium',
    'high',
  ]),
  category: z.enum([
    'content',
    'formatting',
    'skills',
    'experience',
    'education',
    'ats',
    'other',
  ]),
  example: z.string().nullable(),
});

// --------------------------------------------------
// Career recommendations
// --------------------------------------------------

const careerRecommendationSchema = z.object({
  careerTitle: textSchema,
  matchPercentage: percentageSchema,
  reasoning: textSchema,
  requiredSkills: z.array(textSchema),
  missingSkills: z.array(textSchema),
});

// --------------------------------------------------
// Job-specific matching
// --------------------------------------------------

const jobMatchSchema = z.object({
  jobTitle: z.string().nullable(),
  company: z.string().nullable(),
  matchPercentage: percentageSchema,
  matchingSkills: z.array(textSchema),
  missingSkills: z.array(textSchema),
  preferredSkills: z.array(textSchema),
  explanation: textSchema,
});

// --------------------------------------------------
// Complete AI analysis response
// --------------------------------------------------

export const resumeAnalysisSchema = z.object({
  personalInformation: personalInformationSchema,

  professionalSummary: professionalSummarySchema,

  technicalSkills: z.array(skillSchema),

  softSkills: z.array(skillSchema),

  workExperience: z.array(workExperienceSchema),

  education: z.array(educationSchema),

  projects: z.array(projectSchema),

  certifications: z.array(certificationSchema),

  resumeQuality: resumeQualitySchema,

  atsAnalysis: atsAnalysisSchema,

  strengths: z.array(textSchema),

  weaknesses: z.array(textSchema),

  recommendations: z.array(recommendationSchema),

  careerRecommendations: z.array(
    careerRecommendationSchema,
  ),

  jobMatch: jobMatchSchema.nullable(),
});

// --------------------------------------------------
// Export TypeScript types
// --------------------------------------------------

export type ResumeAnalysis = z.infer<
  typeof resumeAnalysisSchema
>;

export type PersonalInformation = z.infer<
  typeof personalInformationSchema
>;

export type ExtractedSkill = z.infer<
  typeof skillSchema
>;

export type WorkExperience = z.infer<
  typeof workExperienceSchema
>;

export type ResumeQuality = z.infer<
  typeof resumeQualitySchema
>;

export type ATSAnalysis = z.infer<
  typeof atsAnalysisSchema
>;