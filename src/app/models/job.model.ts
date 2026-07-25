// Shared Job interface for all components
export interface Job {
  id: string;
  title: string;
  company: string;
  companyImage?: string;
  location?: string;
  jobLocation?: string;
  jobType?: string;
  category: string;
  experience?: string;
  qualification?: string;
  fullInformationTableFormat?: string;
  fullJobInformation?: string;
  walkInDrive?: boolean;
  description: string;
  howToApply?: string;
  keyResponsibilities?: string;
  documentsRequired?: string;
  eligibilityCriteria?: string;
  otherLink?: string;
  whatsappGroupLink?: string;
  walkInInterviewLocation?: string;
  hrDetails?: string;
  createdDate: string;
  updatedDate?: string;
}

// Job Categories - Walk-in categories
export const DEFAULT_JOB_CATEGORIES = [
  'IT Walk-ins',
  'BPO/Non-IT Walk-ins',
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

export interface CompanyImage {
  id: string;
  companyName: string;
  companyImage: string;
  createdDate: string;
  updatedDate?: string;
}

export const CATEGORY_ROUTE_PREFIX = 'job-category';

export const CATEGORY_ROUTE_SLUGS: Record<string, string> = {
  'All': 'all',
  'Walk-ins': 'walk-ins',
  'Non-Walkins': 'non-walkins',
  'B.Tech': 'b-tech',
  'Degree': 'degree',
  'Any Graduate': 'any-graduate',
  'Freshers': 'freshers',
  'Experienced': 'experienced',
  'Vishakhapatnam': 'vishakhapatnam',
  'Hyderabad': 'hyderabad',
  'Bengaluru': 'bengaluru',
  'IT Walk-ins': 'it-walk-ins',
  'BPO/Non-IT Walk-ins': 'bpo-non-it-walk-ins',
  'Sales Walk-ins': 'sales-walk-ins',
  'Banking Walk-ins': 'banking-walk-ins',
  'Pharma Walk-ins': 'pharma-walk-ins'
};

export const CATEGORY_SLUG_TO_LABEL: Record<string, string> = Object.entries(CATEGORY_ROUTE_SLUGS)
  .reduce((acc, [label, slug]) => ({
    ...acc,
    [slug]: label
  }), {} as Record<string, string>);

export function getCategoryRouteSlug(category: string): string {
  return CATEGORY_ROUTE_SLUGS[category] || category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCategoryLabelFromSlug(slug: string): string | null {
  return CATEGORY_SLUG_TO_LABEL[slug] || null;
}