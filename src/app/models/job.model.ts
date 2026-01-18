// Shared Job interface for all components
export interface Job {
  id: string;
  title: string;
  company: string;
  category: string;
  description: string;
  contactInfo: string;
  createdDate: string;
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
}

// Job Categories - simplified list as requested
export const DEFAULT_JOB_CATEGORIES = [
  'Government Jobs',
  'All Private Jobs',
  'Walk-in Drives'
] as const;

export type JobCategory = typeof DEFAULT_JOB_CATEGORIES[number];