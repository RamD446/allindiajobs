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
}

// Job Categories - simplified list as requested
export const DEFAULT_JOB_CATEGORIES = [
  'Government Jobs',
  'All Private Jobs',
  'Walk-in Drives',
  'Bank Jobs',
  'IT Jobs',
  'Pharmaceutical Jobs',
  'Sales and Marketing Jobs',
] as const;

export type JobCategory = typeof DEFAULT_JOB_CATEGORIES[number];

export interface JobCareer {
  id: string;
  company: string;
  jobType: string;
  careerOfficeUrl: string;
  createdDate: string;
}

export interface News {
  id: string;
  title: string;
  newsType: string;
  description: string;
  createdDate: string;
}

export const CAREER_JOB_TYPES = [
  'Government',
  'Central Government',
  'Private Job',
  'MNC Company'
] as const;

export type CareerJobType = typeof CAREER_JOB_TYPES[number];