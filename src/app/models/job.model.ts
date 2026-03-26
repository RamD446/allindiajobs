// Shared Job interface for all components
export interface Job {
  id: string;
  title: string;
  company: string;
  category: string;
  qualification?: string;
  experience?: string;
  salary?: string;
  walkInStartDate?: string;
  walkInEndDate?: string;
  addressAndContact?: string;
  contactInfo?: string;
  description: string;
  howToApply?: string;
  keyResponsibilities?: string;
  documentsRequired?: string;
  eligibilityCriteria?: string;
  otherLink?: string;
  walkInDrive?: boolean;
  createdDate: string;
  updatedDate?: string;
}

// Job Categories - Walk-in categories
export const DEFAULT_JOB_CATEGORIES = [
  'IT Walk-ins',
  'BPO Walk-ins',
  'Non-IT Walk-ins',
  'Sales Walk-ins',
  'Banking Walk-ins',
  'Pharma Walk-ins'
] as const;

// Job Types for Private Jobs with Walk-In Drive
export const PRIVATE_JOB_TYPES = [
  'IT Jobs',
  'Non-IT Jobs',
  'Pharmaceutical Jobs',
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