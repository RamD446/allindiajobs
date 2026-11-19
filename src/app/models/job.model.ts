// Shared Job interface for all components
export interface Job {
  id: string;
  title: string;
  company: string;
  companyImage?: string;
  jobIcon?: string;
  sector?: 'Government' | 'Private';
  privateJobType?: 'Walk-in' | 'Non-walk-in' | null;
  jobType?: string;
  experience?: string;
  totalPosts?: number | null;
  fullInformationTableFormat?: string;
  fullJobInformation?: string;
  walkInDrive?: boolean;
  walkInDate?: string;
  lastDateToApply?: string;
  description: string;
  companyOfficialUrl?: string;
  otherLink?: string;
  applyPdfLink?: string;
  youtubeUrl?: string;
  createdBy?: string;
  createdDate: string;
  updatedDate?: string;
}

// A user-submitted comment on a specific job, keyed by jobId in Firebase
export interface JobComment {
  id: string;
  jobId: string;
  name: string;
  comment: string;
  createdDate: string;
}

// Job Categories - Walk-in categories
export const DEFAULT_JOB_CATEGORIES = [
  'Government Jobs',
  'IT Walk-ins',
  'BPO/Non-IT Walk-ins',
  'Banking Walk-ins',
  'Pharma Walk-ins'
] as const;

// Job Types for Private Jobs with Walk-In Drive
export const PRIVATE_JOB_TYPES: string[] = [
  'IT Jobs',
  'Non-IT Jobs',
  'Pharma Jobs',
  'Sales Jobs',
  'Pharmaceutical Jobs',
  'Bank Jobs',
  'Other'
];

export const GOVERNMENT_JOB_TYPES = ['Government Jobs', 'Upcoming Jobs', 'Results', 'Syllabus'];

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

export const CATEGORY_ROUTE_PREFIX = 'jobcategories';

export const CATEGORY_ROUTE_SLUGS: Record<string, string> = {
  'All': 'all',
  'Walk-ins': 'walk-ins',
  'Government Jobs': 'government-jobs',
  'Results': 'results',
  'Syllabus': 'syllabus',
  'Career Tips': 'career-tips',
  'Freshers': 'freshers',
  'Experienced': 'experienced',
  'B.Tech': 'b-tech',
  'Degree': 'degree',
  'Any Graduate': 'any-graduate',
  'Vishakhapatnam': 'vishakhapatnam',
  'Hyderabad': 'hyderabad',
  'Bengaluru': 'bengaluru',
  'IT Jobs': 'it-jobs',
  'BPO/Non-IT Jobs': 'bpo-non-it-jobs',
  'Banking Jobs': 'banking-jobs',
  'Pharma Jobs': 'pharma-jobs',
  'IT Walk-ins': 'it-walk-ins',
  'BPO/Non-IT Walk-ins': 'bpo-non-it-walk-ins',
  'Banking Walk-ins': 'banking-walk-ins',
  'Pharma Walk-ins': 'pharma-walk-ins'
};

export const CATEGORY_SLUG_TO_LABEL: Record<string, string> = Object.entries(CATEGORY_ROUTE_SLUGS)
  .reduce((acc, [label, slug]) => ({
    ...acc,
    [slug]: label
  }), {} as Record<string, string>);

export const CATEGORY_DISPLAY_LABELS: Record<string, string> = {
  'All': 'All Latest Jobs',
  'Walk-ins': 'Private Walk-ins',
  'Freshers': 'Fresher Jobs',
  'Experienced': 'Experienced Jobs',
  'IT Walk-ins': 'IT Jobs',
  'BPO/Non-IT Walk-ins': 'BPO/Non-IT Jobs',
  'Banking Walk-ins': 'Banking Jobs',
  'Pharma Walk-ins': 'Pharma Jobs'
};

export function getCategoryRouteSlug(category: string): string {
  return CATEGORY_ROUTE_SLUGS[category] || category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCategoryLabelFromSlug(slug: string): string | null {
  return CATEGORY_SLUG_TO_LABEL[slug] || null;
}

export function getCategoryDisplayLabel(category: string): string {
  return CATEGORY_DISPLAY_LABELS[category] || category;
}

export interface JobFilterCategory {
  label: string;
  slug: string;
  sector: 'Government' | 'Private';
  jobType?: string;
  privateJobType?: 'Walk-in' | 'Non-walk-in';
  experience?: string;
}

export const GOVERNMENT_JOB_FILTERS: JobFilterCategory[] = GOVERNMENT_JOB_TYPES.map((jobType) => ({
  label: jobType === 'Government Jobs' ? 'Current jobs' : jobType === 'Upcoming Jobs' ? 'Upcoming jobs' : jobType,
  slug: jobType === 'Government Jobs' ? 'current-jobs' : getCategoryRouteSlug(jobType),
  sector: 'Government',
  jobType
}));

export const PRIVATE_JOB_FILTERS: JobFilterCategory[] = PRIVATE_JOB_TYPES.map((jobType) => ({
  label: jobType,
  slug: getCategoryRouteSlug(jobType),
  sector: 'Private',
  jobType
}));

export const PRIVATE_HIRING_FILTERS: JobFilterCategory[] = [
  { label: 'Walk-in', slug: 'private-walk-ins', sector: 'Private', privateJobType: 'Walk-in' },
  { label: 'Non-walk-in', slug: 'non-walk-in', sector: 'Private', privateJobType: 'Non-walk-in' }
];

export const PRIVATE_EXPERIENCE_FILTERS: JobFilterCategory[] = [
  { label: 'Fresher', slug: 'private-freshers', sector: 'Private', experience: 'Fresher' },
  { label: 'Experienced', slug: 'private-experienced', sector: 'Private', experience: 'Experienced' }
];

export const JOB_FILTER_CATEGORIES: JobFilterCategory[] = [
  { label: 'Private jobs', slug: 'private-jobs', sector: 'Private' },
  ...GOVERNMENT_JOB_FILTERS,
  ...PRIVATE_JOB_FILTERS,
  ...PRIVATE_HIRING_FILTERS,
  ...PRIVATE_EXPERIENCE_FILTERS
];