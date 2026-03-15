// Shared Job interface for all components
export interface Job {
  id: string;
  title: string;
  company: string;
  category: string;
  description: string;
  contactInfo?: string;
  createdDate: string;
  experience?: string;
  // Optional additional fields
  companyDescription?: string;
  companySize?: string;
  applicationInstructions?: string;
  applicationEmail?: string;
  applicationUrl?: string;
  requirements?: string;
  benefits?: string;
  experienceLevel?: string;
  salary?: string;
  walkInStartDate?: string;
  walkInEndDate?: string;
  lastDateToApply?: string;
  importantNotes?: string;
  updatedDate?: string;
  addressAndContact?: string;
  walkInDrive?: boolean;
  jobType?: string;
  qualification?: string;
  howToApply?: string;
}

// Job Categories - simplified list as requested
export const DEFAULT_JOB_CATEGORIES = [
  'Government Jobs',
  'All Private Jobs',
  'Bank Jobs',
  'IT Jobs',
  'Non-IT Jobs',
  'Pharmaceutical Jobs',
  'Sales and Marketing Jobs',
  'Health and Career Tips',
  'Motivation Stories',
  'TeluguToEnglishLearning',
  'Current Affairs',
] as const;

// Job Types for Private Jobs with Walk-In Drive
export const PRIVATE_JOB_TYPES = [
  'IT Jobs',
  'Non-IT Jobs',
  'Pharmaceutical Jobs',
  'Sales and Marketing Jobs',
  'Bank Jobs',
  'Other'
] as const;

export type JobCategory = typeof DEFAULT_JOB_CATEGORIES[number];

export interface JobCareer {
  id: string;
  company: string;
  jobType: string;
  careerOfficeUrl: string;
  createdDate: string;
}

export const CAREER_JOB_TYPES = [
  'Government',
  'Central Government',
  'Global Tech',
  'IT Services MNC'
] as const;

export type CareerJobType = typeof CAREER_JOB_TYPES[number];