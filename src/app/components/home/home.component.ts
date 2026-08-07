import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { onValue, ref } from 'firebase/database';
import { db, auth } from '../../../config/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { Job, CompanyImage, DEFAULT_JOB_CATEGORIES, getCategoryDisplayLabel, getCategoryLabelFromSlug, getCategoryRouteSlug } from '../../models/job.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  jobs: Job[] = [];
  walkinJobs: Job[] = [];
  selectedJobCategory: string = 'All';
  isLoading: boolean = true;
  isLoggedIn: boolean = false;
  // Pagination
  pageSize: number = 20;
  currentPage: number = 1;
  totalPages: number = 1;
  isWalkinOnlyPage: boolean = false;
  isNonWalkinOnlyPage: boolean = false;
  isHomeRootPage: boolean = false;
  companyImageMap: Record<string, string> = {};
  jobCategories: string[] = [...DEFAULT_JOB_CATEGORIES];
  readonly quickFilterCategories: string[] = [
    'Walk-ins',
    'B.Tech',
    'Degree',
    'Any Graduate',
    'Freshers',
    'Experienced',
    'Vishakhapatnam',
    'Hyderabad',
    'Bengaluru'
  ];
  private readonly categoryByPath: Record<string, string> = {
    '/IT-Walk-ins': 'IT Walk-ins',
    '/BPO-Non-IT-Walk-ins': 'BPO/Non-IT Walk-ins',
    '/Banking-Walk-ins': 'Banking Walk-ins',
    '/Pharma-Walk-ins': 'Pharma Walk-ins'
  };

  constructor(private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
    this.setPageSizeBasedOnScreen();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.setPageSizeBasedOnScreen();
  }

  private setPageSizeBasedOnScreen() {
    if (window.innerWidth <= 768) {
      this.pageSize = 5;
    } else {
      this.pageSize = 20;
    }
    this.currentPage = 1;
  }

  ngOnInit() {
    const currentPath = this.router.url.split('?')[0];
    const pathCategory = this.categoryByPath[currentPath] || null;

    this.isWalkinOnlyPage = currentPath.includes('/walkinjobs') || !!pathCategory;
    this.isNonWalkinOnlyPage = currentPath.includes('/non-walkinjobs');
    this.isHomeRootPage = !this.isWalkinOnlyPage && !this.isNonWalkinOnlyPage;

    this.route.paramMap.subscribe(() => {
      this.updateSelectedCategory();
      this.cdr.detectChanges();
    });

    this.route.queryParamMap.subscribe(() => {
      this.updateSelectedCategory();
      this.cdr.detectChanges();
    });

    this.loadCompanyImages();
    this.loadJobs();

    // Listen to authentication state
    onAuthStateChanged(auth, (user) => {
      this.isLoggedIn = !!user;
      this.cdr.detectChanges();
    });
  }

  private getJobTypeFilteredList(jobs: Job[]): Job[] {
    if (this.isWalkinOnlyPage) {
      return jobs.filter(job => job.walkInDrive === true);
    }

    if (this.isNonWalkinOnlyPage) {
      return jobs.filter(job => job.walkInDrive !== true);
    }

    // Root home page should show all jobs, not a hard limit of the first 16.
    return jobs;
  }

  private getCreatedTimestamp(job: Job): number {
    const raw = (job.createdDate || '').toString().trim();
    if (!raw) {
      return 0;
    }

    const normalized = raw.includes('T') && raw.length === 16 ? `${raw}:00` : raw;
    const parsed = new Date(normalized).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private sortByLatestCreated(jobs: Job[]): Job[] {
    return [...jobs].sort((a, b) => this.getCreatedTimestamp(b) - this.getCreatedTimestamp(a));
  }

  private normalizeCompanyName(value: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  loadCompanyImages() {
    try {
      const companyImagesRef = ref(db, 'companyImages');
      onValue(companyImagesRef, (snapshot) => {
        const data = snapshot.val();
        const map: Record<string, string> = {};

        if (data) {
          const rows = Object.keys(data).map((key) => ({
            id: key,
            ...data[key]
          })) as CompanyImage[];

          for (const item of rows) {
            const normalizedName = this.normalizeCompanyName(item.companyName || '');
            if (normalizedName) {
              map[normalizedName] = item.companyImage || '';
            }
          }
        }

        this.companyImageMap = map;
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error loading company images on home:', error);
    }
  }

  private getMappedImageByCompany(companyName: string): string {
    const key = this.normalizeCompanyName(companyName);
    if (!key) {
      return '';
    }

    if (this.companyImageMap[key]) {
      return this.companyImageMap[key];
    }

    const mapKeys = Object.keys(this.companyImageMap);

    const partialMatch = mapKeys.find((k) => key.includes(k) || k.includes(key));
    if (partialMatch) {
      return this.companyImageMap[partialMatch] || '';
    }

    return '';
  }

  loadJobs() {
    this.isLoading = true;
    try {
      const jobsRef = ref(db, 'jobs');
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const mappedJobs = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));

          this.jobs = this.sortByLatestCreated(mappedJobs as Job[]);
          this.walkinJobs = this.sortByLatestCreated(this.getJobTypeFilteredList(this.jobs));

        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }, (error) => {
        console.error('Firebase error:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error loading jobs:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  getFilteredJobsForHome(): Job[] {
    return this.sortByLatestCreated(
      this.walkinJobs.filter((job) => {
        return this.matchesSelectedCategory(job, this.selectedJobCategory);
      })
    );
  }

  getLatestJobsHeading(): string {
    const category = (this.selectedJobCategory || 'All').trim();
    if (!category || category.toLowerCase() === 'all') {
      return 'All Latest Jobs';
    }

    const normalizedCategory = category.endsWith('Jobs') ? category : `${category} Jobs`;
    return `All Latest ${normalizedCategory}`;
  }

  private matchesSelectedCategory(job: Job, selected: string): boolean {
    if (selected === 'All') {
      return true;
    }

    const normalized = selected.trim().toLowerCase();
    const jobType = (job.jobType || '').trim().toLowerCase();
    const category = (job.category || '').trim().toLowerCase();
    const qualification = (job.qualification || '').trim().toLowerCase();
    const experience = (job.experience || '').trim().toLowerCase();
    const location = `${job.location || ''} ${job.jobLocation || ''}`.trim().toLowerCase();

    if (normalized === 'walk-ins') {
      return job.walkInDrive === true || jobType === 'walk-ins';
    }

    if (normalized === 'government-jobs') {
      return job.walkInDrive !== true || jobType === 'government-jobs';
    }

    if (normalized === 'b.tech' || normalized === 'degree' || normalized === 'any graduate') {
      return qualification.includes(normalized);
    }

    if (normalized === 'freshers' || normalized === 'experienced') {
      return experience.includes(normalized);
    }

    if (normalized === 'vishakhapatnam' || normalized === 'hyderabad' || normalized === 'bengaluru') {
      return location.includes(normalized);
    }

    return category === normalized;
  }

  getAllCategoryFilters(): string[] {
    const set = new Set<string>(['All']);

    this.quickFilterCategories.forEach((item) => set.add(item));
    this.jobCategories.forEach((item) => {
      const trimmed = (item || '').trim();
      if (trimmed) {
        set.add(trimmed);
      }
    });

    return Array.from(set);
  }

  getCategoryDisplayLabel(category: string): string {
    return getCategoryDisplayLabel(category);
  }

  getCategoryCount(category: string): number {
    if (category === 'All') {
      return this.walkinJobs.length;
    }

    return this.walkinJobs.filter((job) => job.category === category).length;
  }

  selectCategoryTab(category: string) {
    this.selectedJobCategory = category;
    this.navigateToCategory(category);
  }

  private navigateToCategory(category: string) {
    if (!category || category === 'All') {
      this.router.navigate(['/']);
      return;
    }

    const slug = getCategoryRouteSlug(category);
    this.router.navigate(['/job-category', slug]);
  }

  private updateSelectedCategory() {
    const slug = this.route.snapshot.paramMap.get('category') || '';
    const slugCategory = slug ? getCategoryLabelFromSlug(slug) : null;
    const currentPath = this.router.url.split('?')[0];
    const pathCategory = this.categoryByPath[currentPath] || null;
    const queryCategory = this.route.snapshot.queryParamMap.get('category') || null;

    this.selectedJobCategory = slugCategory || pathCategory || queryCategory || 'All';
  }

  private extractImageSrc(value: string): string | null {
    const raw = (value || '').trim();
    if (!raw) {
      return null;
    }

    const match = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1];
    }

    if (raw.startsWith('data:image/')) {
      return raw;
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    return null;
  }

  getJobCardImage(job: Job): string | null {
    const mapped = this.getMappedImageByCompany(job.company || '');
    return this.extractImageSrc(mapped) || 'assets/images/Freejobinfologo.png';
  }

  getJobDescriptionPreview(job: Job, maxLength: number = 500): string {
    const cleanText = (job.description || '').replace(/\s+/g, ' ').trim();
    if (!cleanText) {
      return 'No description available';
    }

    if (cleanText.length <= maxLength) {
      return cleanText;
    }

    return `${cleanText.slice(0, maxLength)}...`;
  }

  formatWalkInRange(startDate: string | undefined, endDate: string | undefined): string {
    if (!startDate || !endDate) {
      return '';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return '';
    }

    const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
    if (sameMonth) {
      const month = start.toLocaleString('en-US', { month: 'long' });
      return `${start.getDate()}-${end.getDate()} ${month}`;
    }

    const startText = start.toLocaleString('en-US', { day: 'numeric', month: 'short' });
    const endText = end.toLocaleString('en-US', { day: 'numeric', month: 'short' });
    return `${startText} - ${endText}`;
  }

  getTodayWalkinsCount(): number {
    return this.jobs.filter(job => this.isWalkInToday(job)).length;
  }

  isWalkInToday(job: Job): boolean {
    return job.walkInDrive === true;
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, '');
  }

  viewJobDetails(job: Job) {
    const titleSlug = this.createSlug(job.title);
    this.router.navigate(['/job', job.id, titleSlug], { state: { job: job } });
  }

  hasNoData(): boolean {
    return this.getFilteredJobsForHome().length === 0;
  }

  shouldShowSuggested(): boolean {
    return this.getFilteredJobsForHome().length === 0 && this.getFallbackJobsForHome().length > 0;
  }

  /**
   * Return top 20 recent jobs to suggest when current filters return no results.
   */
  getFallbackJobsForHome(): Job[] {
    const fallbackSource = this.walkinJobs.length ? this.walkinJobs : this.jobs;
    return this.sortByLatestCreated(fallbackSource).slice(0, 20);
  }

  getPaginatedJobsForHome(): Job[] {
    const all = this.getFilteredJobsForHome();
    this.totalPages = Math.max(1, Math.ceil(all.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  }

  getVisiblePageNumbers(maxVisible = 3): number[] {
    const total = this.totalPages || 1;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToPage(page: number) {
    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  shareJob(job: Job) {
    const shareText = `Check out this job: ${job.title}`;
    const shareUrl = window.location.origin + '/job/' + job.id;
    
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: shareText,
        url: shareUrl
      }).catch(err => console.log('Share cancelled or failed'));
    } else {
      // Fallback: Copy to clipboard
      const fullText = `${shareText}\n${shareUrl}`;
      navigator.clipboard.writeText(fullText).then(() => {
        alert('Job link copied to clipboard!');
      }).catch(err => {
        alert('Could not copy to clipboard');
      });
    }
  }

  editJob(job: Job) {
    if (!this.isLoggedIn) {
      alert('Please login to edit jobs');
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/login'], { state: { editJobId: job.id, editJob: job } });
  }
}
