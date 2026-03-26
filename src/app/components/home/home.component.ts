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
  walkinJobs: Job[] = [];
  isLoading: boolean = true;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.isLoading = true;
    try {
      const jobsRef = ref(db, 'jobs');
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.jobs = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          })).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

          // Get all jobs with walkInDrive flag set to true
          this.walkinJobs = this.jobs.filter(job => job.walkInDrive === true).slice(0, 20);

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

  getTodayWalkinsCount(): number {
    return this.jobs.filter(job => this.isWalkInToday(job)).length;
  }

  isWalkInToday(job: Job): boolean {
    // Check if job has walkInDrive flag set to true
    if (job.walkInDrive !== true) return false;
    if (!job.walkInStartDate || !job.walkInEndDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(job.walkInStartDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(job.walkInEndDate);
    endDate.setHours(23, 59, 59, 999);

    return today.getTime() >= startDate.getTime() && today.getTime() <= endDate.getTime();
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
