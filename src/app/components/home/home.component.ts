import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { get, onValue, ref } from 'firebase/database';
import { combineLatest, Subscription } from 'rxjs';
import { db } from '../../../config/firebase.config';
import {
  CATEGORY_ROUTE_PREFIX, getCategoryRouteSlug, GOVERNMENT_JOB_TYPES,
  JOB_FILTER_CATEGORIES, Job, JobFilterCategory
} from '../../models/job.model';
import { shareJobMessage } from '../../utils/job-share';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  jobs: Job[] = [];
  topJobIds: string[] = [];
  topJobs: Job[] = [];
  loading = true;
  error = '';
  shareMessage = '';
  query = '';
  appliedQuery = '';
  filter = 'All jobs';
  page = 1;
  readonly pageSize = 30;
  private stopJobs: (() => void) | null = null;
  private stopTopJobs: (() => void) | null = null;
  private routeSubscription: Subscription | null = null;
  private activeCategory: JobFilterCategory | undefined;

  constructor(private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.routeSubscription = combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([routeParams, params]) => {
      this.query = params.get('q') || '';
      this.appliedQuery = this.query.trim();
      const category = routeParams.get('category') || params.get('category');
      this.activeCategory = JOB_FILTER_CATEGORIES.find((item) => item.slug === category);
      this.filter = this.activeCategory?.label || this.filterFromQuery(category);
      this.page = 1;
      this.cdr.markForCheck();
    });

    const jobsRef = ref(db, 'jobs');
    const updateJobs = (data: Record<string, Omit<Job, 'id'>> | null): void => {
      this.jobs = data ? Object.entries(data).map(([id, job]) => ({ id, ...job })) : [];
      this.jobs.sort((first, second) => this.createdTime(second) - this.createdTime(first));
      this.updateTopJobs();
      this.loading = false;
      this.error = '';
      this.cdr.detectChanges();
    };
    const showLoadError = (): void => {
      if (!this.jobs.length) this.error = 'Jobs are unavailable right now. Please try again shortly.';
      this.loading = false;
      this.cdr.detectChanges();
    };

    void get(jobsRef).then((snapshot) => updateJobs(snapshot.val()), showLoadError);
    this.stopJobs = onValue(jobsRef, (snapshot) => updateJobs(snapshot.val()), showLoadError);
    this.stopTopJobs = onValue(ref(db, 'topJobs'), (snapshot) => {
      const value = snapshot.val();
      this.topJobIds = Array.isArray(value)
        ? value.filter((id: unknown): id is string => typeof id === 'string').slice(0, 6)
        : [];
      this.updateTopJobs();
      this.cdr.detectChanges();
    }, () => {
      this.topJobIds = [];
      this.topJobs = [];
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.stopJobs?.();
    this.stopTopJobs?.();
    this.routeSubscription?.unsubscribe();
  }

  get filteredJobs(): Job[] {
    const search = this.appliedQuery.toLowerCase();
    return this.jobs.filter((job) => {
      const categoryMatches = this.matchesFilter(job);
      const searchText = `${job.title || ''} ${job.company || ''} ${this.plainText(job.description || '')}`.toLowerCase();
      return categoryMatches && (!search || searchText.includes(search));
    });
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredJobs.length / this.pageSize));
  }

  get visibleJobs(): Job[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredJobs.slice(start, start + this.pageSize);
  }

  private updateTopJobs(): void {
    const jobsById = new Map(this.jobs.map((job) => [job.id, job]));
    this.topJobs = this.topJobIds.map((id) => jobsById.get(id)).filter((job): job is Job => Boolean(job));
  }

  get listingHeading(): string {
    if (this.appliedQuery) return 'Search results';
    if (this.activeCategory) return this.activeCategory.label;
    switch (this.filter) {
      case 'Government Jobs': return 'Latest government jobs';
      case 'Walk-ins': return 'Latest walk-in jobs';
      case 'Freshers': return 'Latest fresher jobs';
      case 'Experienced': return 'Latest experienced jobs';
      default: return 'All latest jobs';
    }
  }

  get recentGovernmentJobs(): Job[] {
    return this.jobs.filter((job) => job.jobType === 'Government Jobs').slice(0, 10);
  }

  get recentWalkIns(): Job[] {
    return this.jobs.filter((job) => job.walkInDrive === true || job.privateJobType === 'Walk-in').slice(0, 10);
  }

  applySearch(): void {
    this.appliedQuery = this.query.trim();
    this.page = 1;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.appliedQuery || null },
      queryParamsHandling: 'merge'
    });
  }

  selectFilter(filter: string): void {
    this.filter = filter;
    this.page = 1;
    const commands = filter === 'All jobs' ? ['/'] : ['/', CATEGORY_ROUTE_PREFIX, getCategoryRouteSlug(filter)];
    void this.router.navigate(commands, {
      queryParams: { q: this.appliedQuery || null }
    });
  }

  filterSidebar(filter: string): void {
    this.selectFilter(filter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setPage(page: number): void {
    this.page = Math.min(Math.max(1, page), this.pageCount);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  jobLink(job: Job): string[] {
    return ['/job', job.id, this.slug(job.title || '')];
  }

  jobImage(job: Job): string | null {
    return this.imageSource(job.companyImage || '');
  }

  companyInitial(job: Job): string {
    return (job.company || job.title || 'J').trim().charAt(0).toUpperCase();
  }

  postedDate(value?: string): string {
    if (!value) return 'Recently posted';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Recently posted' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async shareJob(job: Job): Promise<void> {
    this.shareMessage = '';
    const url = `${window.location.origin}${this.jobLink(job).join('/')}`;
    this.shareMessage = await shareJobMessage(job, url);
    this.cdr.markForCheck();
  }

  private filterFromQuery(value: string | null): string {
    if (value === 'government' || value === getCategoryRouteSlug('Government Jobs')) return 'Government Jobs';
    if (value === 'walk-ins') return 'Walk-ins';
    if (value === 'freshers') return 'Freshers';
    if (value === 'experienced') return 'Experienced';
    return 'All jobs';
  }

  private matchesFilter(job: Job): boolean {
    if (this.activeCategory) {
      const category = this.activeCategory;
      const sector = job.sector || (GOVERNMENT_JOB_TYPES.includes(job.jobType || '') ? 'Government' : 'Private');
      if (sector !== category.sector) return false;
      if (category.jobType && job.jobType !== category.jobType) return false;
      if (category.privateJobType) {
        const hiringType = job.privateJobType || (job.walkInDrive || job.jobType === 'Walk-ins' ? 'Walk-in' : null);
        if (hiringType !== category.privateJobType) return false;
      }
      return !category.experience || category.experience.split(',').every((experience) =>
        (job.experience || '').toLowerCase().includes(experience.trim().toLowerCase())
      );
    }
    if (this.filter === 'All jobs') return true;
    if (this.filter === 'Government Jobs') return job.sector === 'Government' || job.jobType === 'Government Jobs';
    if (this.filter === 'Walk-ins') return job.walkInDrive === true || job.privateJobType === 'Walk-in' || job.jobType === 'Walk-ins';
    return (job.experience || '').toLowerCase().includes(this.filter.toLowerCase());
  }

  private createdTime(job: Job): number {
    const value = new Date(job.createdDate || '').getTime();
    return Number.isNaN(value) ? 0 : value;
  }

  private plainText(value: string): string {
    return value.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').trim();
  }

  private imageSource(value: string): string | null {
    const raw = value.trim();
    const match = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) return match[1];
    return /^(https?:\/\/|data:image\/)/i.test(raw) ? raw : null;
  }

  private slug(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}