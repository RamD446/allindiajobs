import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { onValue, ref } from 'firebase/database';
import { db } from '../../../config/firebase.config';
import { Job } from '../../models/job.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  jobs: Job[] = [];
  filteredJobs: Job[] = [];
  walkinJobs: Job[] = [];
  uniqueCompanies: string[] = [];
  selectedCompany: string = '';
  isLoading: boolean = true;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadJobs();
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

          this.jobs = this.sortByLatestCreated(mappedJobs);

          this.filteredJobs = [...this.jobs];
          this.extractUniqueCompanies();

          // 4x4 card layout: keep top 16 walk-in jobs
          this.walkinJobs = this.sortByLatestCreated(this.jobs.filter(job => job.walkInDrive === true)).slice(0, 16);

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

  extractUniqueCompanies() {
    const companies = this.jobs
      .map(job => job.company)
      .filter((company): company is string => !!company);
    this.uniqueCompanies = Array.from(new Set(companies)).sort();
  }

  filterByCompany(company: string) {
    this.selectedCompany = company;
    if (company) {
      this.filteredJobs = this.sortByLatestCreated(this.jobs.filter(job => job.company === company));
      this.walkinJobs = this.sortByLatestCreated(this.jobs.filter(job => job.walkInDrive === true && job.company === company)).slice(0, 16);
    } else {
      this.filteredJobs = this.sortByLatestCreated(this.jobs);
      this.walkinJobs = this.sortByLatestCreated(this.jobs.filter(job => job.walkInDrive === true)).slice(0, 16);
    }
  }

  getJobCardImage(job: Job): string | null {
    const sources = [job.description || '', job.fullInformationTableFormat || ''];

    for (const html of sources) {
      const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
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
    return this.jobs.length === 0;
  }
}
