import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { get, onValue, ref } from 'firebase/database';
import { db } from '../../../config/firebase.config';
import { Job } from '../../models/job.model';

type JobFilter = 'All jobs' | 'Government Jobs' | 'Walk-ins' | 'Freshers' | 'Experienced';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  jobs: Job[] = [];
  loading = true;
  error = '';
  query = '';
  appliedQuery = '';
  filter: JobFilter = 'All jobs';
  page = 1;
  readonly pageSize = 30;
  private stopJobs: (() => void) | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.query = params.get('q') || '';
      this.appliedQuery = this.query.trim();
      this.filter = this.filterFromQuery(params.get('category'));
      this.page = 1;
    });

    const jobsRef = ref(db, 'jobs');
    const updateJobs = (data: Record<string, Omit<Job, 'id'>> | null): void => {
      this.jobs = data ? Object.entries(data).map(([id, job]) => ({ id, ...job })) : [];
      this.jobs.sort((first, second) => this.createdTime(second) - this.createdTime(first));
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
  }

  ngOnDestroy(): void {
    this.stopJobs?.();
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

  selectFilter(filter: JobFilter): void {
    this.filter = filter;
    this.page = 1;
    const category = filter === 'All jobs' ? 'all' : filter === 'Government Jobs' ? 'government'
      : filter === 'Walk-ins' ? 'walk-ins' : filter.toLowerCase();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category === 'all' ? null : category, q: this.appliedQuery || null },
      queryParamsHandling: 'merge'
    });
  }

  filterSidebar(filter: JobFilter): void {
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

  shareJob(job: Job): void {
    const url = `${window.location.origin}${this.jobLink(job).join('/')}`;
    if (navigator.share) {
      void navigator.share({ title: job.title, url });
      return;
    }
    void navigator.clipboard?.writeText(url);
  }

  private filterFromQuery(value: string | null): JobFilter {
    if (value === 'government') return 'Government Jobs';
    if (value === 'walk-ins') return 'Walk-ins';
    if (value === 'freshers') return 'Freshers';
    if (value === 'experienced') return 'Experienced';
    return 'All jobs';
  }

  private matchesFilter(job: Job): boolean {
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