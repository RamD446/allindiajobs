import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { onValue, ref, get, update } from 'firebase/database';
import { db } from '../../../config/firebase.config';
import { Job, JobCareer, CAREER_JOB_TYPES } from '../../models/job.model';

@Component({
  selector: 'app-job-category',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-category.component.html',
  styleUrl: './job-category.component.css'
})
export class JobCategoryComponent implements OnInit {
    jobsPerPage: number = 20;
    currentPage: number = 1;
  jobs: Job[] = [];
  filteredJobs: Job[] = [];
  jobCareers: JobCareer[] = [];
  filteredCareers: JobCareer[] = [];
  careerJobTypes: string[] = [...CAREER_JOB_TYPES];
  selectedCareerType: string = '';
  categoryTitle: string = '';
  categoryParam: string = '';
  isLoading: boolean = true;
  selectedJobTypes: string[] = [];
  selectedCompanies: string[] = [];
  selectedCategories: string[] = [];
  selectedExperienceLevels: string[] = [];
  selectedSalaries: string[] = [];

  private categoryMappings: { [key: string]: { title: string; category: string } } = {
    'all-latest-jobs': { title: 'All Latest Jobs', category: 'All Latest Jobs' },
    'government-jobs': { title: 'Government Jobs', category: 'Government Jobs' },
    'private-jobs': { title: 'All Private Jobs', category: 'All Private Jobs' },
    'walk-in-drives': { title: 'Walk-in Drives', category: 'Walk-in Drives' },
    'banking-jobs': { title: 'Banking Jobs', category: 'Banking Jobs' },
    'it-jobs': { title: 'IT Jobs', category: 'IT Jobs' },
    'fresher-jobs': { title: 'Fresher Jobs', category: 'Fresher Jobs' },
    'today-jobs': { title: 'Today Posted Jobs', category: 'Today Posted Jobs' },
    'today-walkins': { title: 'Today Walk-in Drives', category: 'Today Walk-in Drives' },
    'today-expired-gov-jobs': { title: 'Today Expired Gov Jobs', category: 'Today Expired Gov Jobs' },
    'health-and-career-tips': { title: 'Health and Career Tips', category: 'Health and Career Tips' },
    'motivation-stories': { title: 'Motivation Stories', category: 'Motivation Stories' }
  };

  constructor(private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.route.url.subscribe(urlSegments => {
      const path = urlSegments.map(segment => segment.path).join('/');
      this.categoryParam = path;
      
      console.log('Current route path:', path); // Debug log
      
      const mapping = this.categoryMappings[path];
      if (mapping) {
        this.categoryTitle = mapping.title;
        this.loadJobs(mapping.category);
      } else {
        this.categoryTitle = 'All Latest Jobs';
        this.loadJobs('All Latest Jobs');
      }
      this.loadJobCareers();
    });
  }

  loadJobs(category: string) {
    this.isLoading = true;
    this.currentPage = 1; // Reset to first page when category changes or data is reloaded
    
    // Track API call
    try {
      get(ref(db, 'stats/apiCalls')).then(snapshot => {
        const count = (snapshot.val() || 0) + 1;
        update(ref(db, 'stats'), { apiCalls: count });
      });
    } catch (e) { console.error('Error tracking API call:', e); }

    try {
      const jobsRef = ref(db, 'jobs');
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        console.log('Firebase data received:', data); // Debug log
        
        if (data) {
          this.jobs = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          
          console.log('All jobs loaded:', this.jobs); // Debug log
          
          // Filter jobs by category
          if (category === 'All Latest Jobs') {
            this.filteredJobs = this.jobs.filter(job => 
              job.category !== 'Health and Career Tips' && 
              job.category !== 'Motivation Stories'
            );
          } else if (category === 'All Private Jobs') {
            // Include Private Jobs, Walk-in Drives, and all Bank-related jobs
            // EXCLUDE Health Tips and Motivation Stories
            this.filteredJobs = this.jobs.filter(job => 
              (job.category === 'All Private Jobs' || 
              job.category === 'Walk-in Drives' ||
              (job.category && (job.category.toLowerCase().includes('bank') || job.category.includes('SBI') || job.category.includes('IBPS') || job.category.includes('RBI')))) &&
              job.category !== 'Health and Career Tips' && 
              job.category !== 'Motivation Stories'
            );
          } else if (category === 'Banking Jobs') {
            // Include all bank-related categories
            this.filteredJobs = this.jobs.filter(job => 
              job.category && (job.category.toLowerCase().includes('bank') || job.category.includes('SBI') || job.category.includes('IBPS') || job.category.includes('RBI'))
            );
          } else if (category === 'Fresher Jobs') {
            this.filteredJobs = this.jobs.filter(job => job.experience === 'Fresher');
          } else if (category === 'Today Posted Jobs') {
            this.filteredJobs = this.jobs.filter(job => this.isToday(job.createdDate));
          } else if (category === 'Today Walk-in Drives') {
            this.filteredJobs = this.jobs.filter(job => this.isWalkInToday(job));
          } else if (category === 'Today Expired Gov Jobs') {
            this.filteredJobs = this.jobs.filter(job => job.category === 'Government Jobs' && job.lastDateToApply && this.isToday(job.lastDateToApply));
          } else {
            this.filteredJobs = this.jobs.filter(job => job.category === category);
          }
          
          console.log('Filtered jobs for', category, ':', this.filteredJobs); // Debug log
        } else {
          console.log('No data found in Firebase'); // Debug log
          this.jobs = [];
          this.filteredJobs = [];
        }
        
        console.log('Setting isLoading to false'); // Debug log
        this.isLoading = false;
        this.cdr.detectChanges(); // Force change detection
      }, (error) => {
        console.error('Firebase error:', error); // Error log
        this.isLoading = false;
        this.cdr.detectChanges(); // Force change detection
      });
    } catch (error) {
      console.error('Error loading jobs:', error);
      this.isLoading = false;
      this.cdr.detectChanges(); // Force change detection
    }
  }

  loadJobCareers() {
    try {
      const careersRef = ref(db, 'jobCareers');
      onValue(careersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.jobCareers = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          // By default, filter by the first type or show none
          if (this.selectedCareerType) {
            this.filterCareersByType(this.selectedCareerType);
          }
        }
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error loading careers:', error);
    }
  }

  filterCareersByType(type: string) {
    this.selectedCareerType = type;
    this.filteredCareers = this.jobCareers.filter(career => career.jobType === type);
    this.cdr.detectChanges();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  }

  isToday(dateString: string): boolean {
    if (!dateString) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    
    return d.getTime() === today.getTime();
  }

  isWalkInToday(job: Job): boolean {
    if (job.category !== 'Walk-in Drives') return false;
    if (!job.walkInStartDate || !job.walkInEndDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(job.walkInStartDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(job.walkInEndDate);
    endDate.setHours(23, 59, 59, 999);

    return today.getTime() >= startDate.getTime() && today.getTime() <= endDate.getTime();
  }

  getTodayJobsCount(): number {
    return this.jobs.filter(job => this.isToday(job.createdDate)).length;
  }

  getTodayWalkinsCount(): number {
    return this.jobs.filter(job => this.isWalkInToday(job)).length;
  }

  getTodayExpiredGovJobsCount(): number {
    return this.jobs.filter(job => job.category === 'Government Jobs' && job.lastDateToApply && this.isToday(job.lastDateToApply)).length;
  }

  getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';

  if (diffMins < 60)
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

  // Less than 24 hours → Today
  if (diffHours < 24)
    return 'Today Posted';

  // 1 to 10 days
  if (diffDays <= 10)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  // Older than 10 days → show full date
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

  isExpired(job: Job): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (job.category === 'Government Jobs' && job.lastDateToApply) {
      const lastDate = new Date(job.lastDateToApply);
      lastDate.setHours(0, 0, 0, 0);
      return lastDate.getTime() < today.getTime();
    }
    if (job.category === 'Walk-in Drives' && job.walkInEndDate) {
      const endDate = new Date(job.walkInEndDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate.getTime() < today.getTime();
    }
    return false;
  }

  // Method to get color class for job category badge
  getCategoryClass(category: string): string {
    switch (category) {
      case 'Government Jobs':
        return 'badge-success';
      case 'All Private Jobs':
        return 'badge-warning';
      case 'Walk-in Drives':
        return 'badge-info';
      case 'Banking Jobs':
        return 'badge-danger';
      case 'IT Jobs':
        return 'badge-primary';
      case 'Health and Career Tips':
        return 'badge-info';
      case 'Motivation Stories':
        return 'badge-warning';
      default:
        return 'badge-primary';
    }
  }

  // Create URL-friendly slug from job title
  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Navigate to job detail page
  viewJobDetails(job: Job) {
    // Track Job Click
    try {
      get(ref(db, 'stats/jobClicks')).then(snapshot => {
        const count = (snapshot.val() || 0) + 1;
        update(ref(db, 'stats'), { jobClicks: count });
      });
    } catch (e) { console.error('Error tracking job click:', e); }

    const titleSlug = this.createSlug(job.title);
    this.router.navigate(['/job', job.id, titleSlug], { state: { job: job } });
  }

  // Save/bookmark job functionality
  saveJob(job: Job) {
    console.log('Job saved/bookmarked:', job.title);
    // Here you can implement save functionality to local storage or Firebase
    // For now, we'll just show console log
    alert(`Job "${job.title}" has been saved to your bookmarks!`);
  }

  // Share job functionality
  shareJob(job: Job) {
    console.log('Sharing job:', job.title);
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job opportunity at ${job.company}`,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareText = `Check out this job: ${job.title} at ${job.company}`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Job information copied to clipboard!');
      });
    }
  }

  // Get new jobs (created in last 7 days)
  getNewJobs(): Job[] {
    // Return jobs for the current page, sorted by newest first
    const sorted = [...this.filteredJobs].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    const start = (this.currentPage - 1) * this.jobsPerPage;
    const end = start + this.jobsPerPage;
    return sorted.slice(start, end);
  }

  getGovJobs(): Job[] {
    const jobs = this.getNewJobs();
    return jobs.filter(job => job.category === 'Government Jobs');
  }

  getPrivateJobs(): Job[] {
    const jobs = this.getNewJobs();
    return jobs.filter(job => job.category !== 'Government Jobs');
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredJobs.length / this.jobsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  // Get other jobs (older than 7 days)
  getOtherJobs(): Job[] {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return this.filteredJobs.filter(job => {
      const createdDate = new Date(job.createdDate);
      return createdDate < sevenDaysAgo;
    }).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }

  // Navigate to different job categories
  navigateToCategory(category: string) {
    const routeMapping: { [key: string]: string } = {
      'Government Jobs': 'government-jobs',
      'All Private Jobs': 'private-jobs',
      'Walk-in Drives': 'walk-in-drives',
      'Banking Jobs': 'banking-jobs',
      'IT Jobs': 'it-jobs',
      'Health and Career Tips': 'health-and-career-tips',
      'Motivation Stories': 'motivation-stories'
    };

    const route = routeMapping[category];
    if (route) {
      this.router.navigate([`/${route}`]);
    }
  }

  // Open external channels (YouTube / WhatsApp) in a new tab
  openExternalChannel(url: string) {
    try {
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      // fallback: set location (will navigate away)
      window.location.href = url;
    }
  }

  // Filter methods for quick filters
  getUniqueCompanies(): string[] {
    const companies = [...new Set(this.filteredJobs.map(job => job.company))];
    return companies.filter(company => company).sort().slice(0, 100);
  }

  getUniqueCategories(): string[] {
    const cats = [...new Set(this.filteredJobs.map(job => job.category))];
    return cats.filter((c): c is string => !!c).sort();
  }

  getUniqueExperienceLevels(): string[] {
    const exps = [...new Set(this.filteredJobs.map(job => job.experienceLevel))];
    return exps.filter((e): e is string => !!e).sort();
  }

  getUniqueSalaries(): string[] {
    const sals = [...new Set(this.filteredJobs.map(job => job.salary))];
    return sals.filter((s): s is string => !!s).sort();
  }

  getJobCountByCompany(company: string): number {
    return this.filteredJobs.filter(job => job.company === company).length;
  }

  getJobCountByCategory(category: string): number {
    return this.filteredJobs.filter(job => job.category === category).length;
  }

  getTotalJobCountByCategory(category: string): number {
    if (category === 'All') return this.jobs.length;
    if (category === 'Banking Jobs') {
      return this.jobs.filter(job => 
        job.category && (job.category.toLowerCase().includes('bank') || job.category.includes('SBI') || job.category.includes('IBPS') || job.category.includes('RBI'))
      ).length;
    }
    if (category === 'All Private Jobs') {
       return this.jobs.filter(job => 
        job.category === 'All Private Jobs' || 
        job.category === 'Walk-in Drives' ||
        (job.category && (job.category.toLowerCase().includes('bank') || job.category.includes('SBI') || job.category.includes('IBPS') || job.category.includes('RBI')))
      ).length;
    }
    if (category === 'Fresher Jobs') {
      return this.jobs.filter(job => job.experience === 'Fresher').length;
    }
    if (category === 'Today Posted Jobs') {
      return this.getTodayJobsCount();
    }
    if (category === 'Today Walk-in Drives') {
      return this.getTodayWalkinsCount();
    }
    if (category === 'Today Expired Gov Jobs') {
      return this.getTodayExpiredGovJobsCount();
    }
    return this.jobs.filter(job => job.category === category).length;
  }

  getJobCountByExperience(exp: string): number {
    return this.filteredJobs.filter(job => job.experienceLevel === exp).length;
  }

  getJobCountBySalary(sal: string): number {
    return this.filteredJobs.filter(job => job.salary === sal).length;
  }

  hasActiveFilters(): boolean {
    return this.selectedCompanies.length > 0 || 
           this.selectedCategories.length > 0 || 
           this.selectedExperienceLevels.length > 0 ||
           this.selectedSalaries.length > 0;
  }

  clearAllFilters() {
    this.selectedCompanies = [];
    this.selectedCategories = [];
    this.selectedExperienceLevels = [];
    this.selectedSalaries = [];
    this.applyFilters();
  }

  filterByCategory(event: any) {
    const cat = event.target.value;
    if (event.target.checked) {
      this.selectedCategories.push(cat);
    } else {
      this.selectedCategories = this.selectedCategories.filter(c => c !== cat);
    }
    this.applyFilters();
  }

  filterByExperienceLevel(event: any) {
    const exp = event.target.value;
    if (event.target.checked) {
      this.selectedExperienceLevels.push(exp);
    } else {
      this.selectedExperienceLevels = this.selectedExperienceLevels.filter(e => e !== exp);
    }
    this.applyFilters();
  }

  filterBySalary(event: any) {
    const sal = event.target.value;
    if (event.target.checked) {
      this.selectedSalaries.push(sal);
    } else {
      this.selectedSalaries = this.selectedSalaries.filter(s => s !== sal);
    }
    this.applyFilters();
  }

  getJobCountByType(jobType: string): number {
    return this.jobs.filter(job => job.category === jobType).length;
  }

  filterByCompany(event: any) {
    const company = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
      this.selectedCompanies.push(company);
    } else {
      this.selectedCompanies = this.selectedCompanies.filter(comp => comp !== company);
    }
    
    this.applyFilters();
  }

  filterByJobType(event: any) {
    const jobType = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
      this.selectedJobTypes.push(jobType);
    } else {
      this.selectedJobTypes = this.selectedJobTypes.filter(type => type !== jobType);
    }
    
    this.applyFilters();
  }

  applyFilters() {
    this.currentPage = 1; // Reset to first page when filters are applied
    let filtered = this.jobs;

    // Apply category filter
    if (this.categoryTitle !== 'All Latest Jobs') {
      if (this.categoryTitle === 'All Private Jobs') {
        // Include Private Jobs, Walk-in Drives, and all Bank-related jobs
        filtered = filtered.filter(job => 
          job.category === 'All Private Jobs' || 
          job.category === 'Walk-in Drives' ||
          (job.category && (job.category.toLowerCase().includes('bank') || job.category.includes('SBI') || job.category.includes('IBPS') || job.category.includes('RBI')))
        );
      } else if (this.categoryTitle === 'Banking Jobs') {
        filtered = filtered.filter(job => 
          job.category && (job.category.toLowerCase().includes('bank') || job.category.includes('SBI') || job.category.includes('IBPS') || job.category.includes('RBI'))
        );
      } else {
        filtered = filtered.filter(job => job.category === this.categoryTitle);
      }
    }

    // Apply job type filters
    if (this.selectedJobTypes.length > 0) {
      filtered = filtered.filter(job => this.selectedJobTypes.includes(job.category));
    }

    // Apply company filters
    if (this.selectedCompanies.length > 0) {
      filtered = filtered.filter(job => this.selectedCompanies.includes(job.company));
    }

    // Apply category filters
    if (this.selectedCategories.length > 0) {
      filtered = filtered.filter(job => this.selectedCategories.includes(job.category));
    }

    // Apply experience level filters
    if (this.selectedExperienceLevels.length > 0) {
      filtered = filtered.filter(job => job.experienceLevel && this.selectedExperienceLevels.includes(job.experienceLevel));
    }

    // Apply salary filters
    if (this.selectedSalaries.length > 0) {
      filtered = filtered.filter(job => job.salary && this.selectedSalaries.includes(job.salary));
    }

    this.filteredJobs = filtered;
    this.cdr.detectChanges();
    
    // Scroll to top when filter is applied
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}