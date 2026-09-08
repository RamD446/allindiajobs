import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { onValue, ref } from 'firebase/database';
import { db, auth } from '../../../config/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { Job, CompanyImage, getCategoryDisplayLabel, getCategoryLabelFromSlug, getCategoryRouteSlug } from '../../models/job.model';
import { RecentPostsComponent } from '../recent-posts/recent-posts.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, RecentPostsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  jobs: Job[] = [];
  walkinJobs: Job[] = [];
  selectedJobCategory: string = 'All';
  selectedCompanyFilter: string = '';
  isLoading: boolean = true;
  isLoggedIn: boolean = false;
  // Pagination
  pageSize: number = 30;
  currentPage: number = 1;
  totalPages: number = 1;
  isWalkinOnlyPage: boolean = false;
  isNonWalkinOnlyPage: boolean = false;
  isHomeRootPage: boolean = false;
  companyImageMap: Record<string, string> = {};
  readonly quickFilterCategories: string[] = [
    'All',
    'Walk-ins',
    'Government Jobs',
    'Results',
    'Syllabus',
    'Career Tips',
    'Freshers',
    'Experienced'
  ];

  constructor(private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
    this.currentPage = 1;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.currentPage = 1;
  }

  private setPageSizeBasedOnScreen() {
    this.currentPage = 1;
  }

  ngOnInit() {
    const currentPath = this.router.url.split('?')[0];

    this.isWalkinOnlyPage = currentPath.includes('/walkinjobs');
    this.isNonWalkinOnlyPage = currentPath.includes('/non-walkinjobs');
    this.isHomeRootPage = !this.isWalkinOnlyPage && !this.isNonWalkinOnlyPage;

    this.route.paramMap.subscribe(() => {
      this.updateSelectedCategory();
      this.cdr.detectChanges();
    });

    this.route.queryParamMap.subscribe((params) => {
      this.selectedCompanyFilter = params.get('company') || '';
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
        const matchesCategory = this.matchesSelectedCategory(job, this.selectedJobCategory);
        const matchesCompany = !this.selectedCompanyFilter
          || (job.company || '').trim().toLowerCase() === this.selectedCompanyFilter.trim().toLowerCase();
        return matchesCategory && matchesCompany;
      })
    );
  }

  getLatestJobsHeading(): string {
    if (this.selectedCompanyFilter) {
      return `Jobs at ${this.selectedCompanyFilter}`;
    }

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

    const normalized = selected.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const jobType = (job.jobType || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const experience = (job.experience || '').trim().toLowerCase();

    if (normalized === 'walk-ins') {
      return job.walkInDrive === true || jobType === 'walk-ins';
    }

    if (normalized === 'government-jobs') {
      return jobType === 'government-jobs';
    }

    if (normalized === 'freshers' || normalized === 'experienced') {
      return experience.includes(normalized.replace(/-/g, ' '));
    }

    return jobType === normalized;
  }

  getAllCategoryFilters(): string[] {
    const seenLabels = new Set<string>();
    const result: string[] = [];

    const addCategory = (item: string) => {
      const trimmed = (item || '').trim();
      if (!trimmed) {
        return;
      }
      const label = getCategoryDisplayLabel(trimmed);
      if (!seenLabels.has(label)) {
        seenLabels.add(label);
        result.push(trimmed);
      }
    };

    addCategory('All');
    this.quickFilterCategories.forEach(addCategory);

    return result;
  }

  getCategoryDisplayLabel(category: string): string {
    return getCategoryDisplayLabel(category);
  }

  getCategoryCount(category: string): number {
    if (category === 'All') {
      return this.walkinJobs.length;
    }

    return this.walkinJobs.filter((job) => job.jobType === category).length;
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
    const queryCategory = this.route.snapshot.queryParamMap.get('category') || null;

    this.selectedJobCategory = slugCategory || queryCategory || 'All';
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
    const titleSlug = this.createSlug(job.title);
    const shareText = `Check out this job: ${job.title}`;
    const shareUrl = `${window.location.origin}/job/${job.id}/${titleSlug}`;

    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: shareText,
        url: shareUrl
      }).catch(err => console.log('Share cancelled or failed'));
    } else {
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

  getRecentGovernmentJobs(): Job[] {
    // Filter jobs to show only Government Jobs type and return latest 10
    return this.jobs
      .filter(job => job.jobType === 'Government Jobs')
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 10);
  }

  getRecentWalkInJobs(): Job[] {
    // Filter jobs flagged as walk-in drive and return latest 10
    return this.jobs
      .filter(job => job.walkInDrive === true)
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 10);
  }
}
