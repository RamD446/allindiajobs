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
  'IT / Software Jobs',
  'Non-IT / BPO Jobs', 
  'Government Jobs',
  'All Private/ Bank Jobs',
  'Walk-in Drive/Internships Jobs'
] as const;

export type JobCategory = typeof DEFAULT_JOB_CATEGORIES[number];