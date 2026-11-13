import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { onValue, push, ref, runTransaction, set } from 'firebase/database';
import { db } from '../../../config/firebase.config';
import { Job, JobComment } from '../../models/job.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-job-full-information',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './job-full-information.html',
  styleUrl: './job-full-information.css'
})
export class JobFullInformation implements OnInit, OnDestroy {
  job: Job | null = null;
  recentJobs: Job[] = [];
  comments: JobComment[] = [];
  loading = true;
  name = '';
  comment = '';
  commentError = '';
  savingComment = false;
  private routeSubscription: Subscription | null = null;
  private stopJob: (() => void) | null = null;
  private stopRecentJobs: (() => void) | null = null;
  private stopComments: (() => void) | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const jobId = params.get('id');
      if (jobId) this.loadJob(jobId);
      else {
        this.job = null;
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.stopJob?.();
    this.stopRecentJobs?.();
    this.stopComments?.();
  }

  private loadJob(jobId: string): void {
    this.loading = true;
    this.job = null;
    this.comments = [];
    this.commentError = '';
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.cdr.detectChanges();

    this.stopJob?.();
    this.stopRecentJobs?.();
    this.stopComments?.();

    this.stopJob = onValue(ref(db, `jobs/${jobId}`), (snapshot) => {
      this.job = snapshot.exists() ? { id: jobId, ...snapshot.val() } as Job : null;
      this.loading = false;
      this.cdr.detectChanges();
    }, () => {
      this.job = null;
      this.loading = false;
      this.cdr.detectChanges();
    });

    this.stopRecentJobs = onValue(ref(db, 'jobs'), (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<Job, 'id'>> | null;
      this.recentJobs = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : [];
      this.recentJobs = this.recentJobs.filter((job) => job.id !== jobId)
        .sort((first, second) => this.time(second.createdDate) - this.time(first.createdDate)).slice(0, 10);
      this.cdr.detectChanges();
    }, () => {
      this.recentJobs = [];
      this.cdr.detectChanges();
    });

    this.stopComments = onValue(ref(db, `comments/${jobId}`), (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<JobComment, 'id'>> | null;
      this.comments = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : [];
      this.comments.sort((first, second) => this.time(second.createdDate) - this.time(first.createdDate));
      this.cdr.detectChanges();
    }, () => {
      this.comments = [];
      this.cdr.detectChanges();
    });

    void runTransaction(ref(db, 'stats/jobClicks'), (count) => (count || 0) + 1);
  }

  get detailRows(): Array<[string, string]> {
    if (!this.job) return [];
    const rows: Array<[string, string]> = [];
    if (this.job.company) rows.push(['Company', this.job.company]);
    if (this.job.createdBy) rows.push(['Job posted by', this.job.createdBy]);
    for (const line of this.plainText(this.job.fullInformationTableFormat || '').split('\n')) {
      const divider = line.indexOf(':');
      if (divider > 0) {
        const label = line.slice(0, divider).trim();
        const value = line.slice(divider + 1).trim();
        if (label && value) rows.push([label, value]);
      }
    }
    return rows;
  }

  get popularCompanies(): string[] {
    return [...new Set(this.recentJobs.map((job) => job.company?.trim()).filter((value): value is string => Boolean(value)))].slice(0, 6);
  }

  imageSource(value?: string): string | null {
    const raw = (value || '').trim();
    const match = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) return match[1];
    return /^(https?:\/\/|data:image\/)/i.test(raw) ? raw : null;
  }

  plainText(value: string): string {
    return (value || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li|div|h[1-6])>/gi, '\n').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').trim();
  }

  displayDate(value?: string): string {
    if (!value) return 'Recently posted';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  jobLink(job: Job): string[] {
    return ['/job', job.id, (job.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')];
  }

  shareJob(): void {
    if (!this.job) return;
    const url = window.location.href;
    if (navigator.share) void navigator.share({ title: this.job.title, url });
    else void navigator.clipboard?.writeText(url);
  }

  async submitComment(): Promise<void> {
    const name = this.name.trim();
    const comment = this.comment.trim();
    this.commentError = '';
    if (!this.job) return;
    if (!name || !comment) {
      this.commentError = 'Enter your name and a comment.';
      return;
    }
    if (name.length > 10 || comment.length > 50) {
      this.commentError = 'Name limit is 10 characters; comment limit is 50.';
      return;
    }

    this.savingComment = true;
    try {
      await set(push(ref(db, `comments/${this.job.id}`)), { name, comment, createdDate: new Date().toISOString() });
      this.name = '';
      this.comment = '';
    } catch {
      this.commentError = 'Could not post your comment. Please try again.';
    } finally {
      this.savingComment = false;
      this.cdr.detectChanges();
    }
  }

  filterByCompany(company: string): void {
    void this.router.navigate(['/'], { queryParams: { q: company } });
  }

  private time(value?: string): number {
    const time = new Date(value || '').getTime();
    return Number.isNaN(time) ? 0 : time;
  }
}