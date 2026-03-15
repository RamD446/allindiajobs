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
  govJobs: Job[] = [];
  privateJobs: Job[] = [];
  walkinJobs: Job[] = [];
  tipsJobs: Job[] = [];
  teluguJobs: Job[] = [];
  currentAffairsJobs: Job[] = [];
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

          this.govJobs = this.jobs.filter(job => job.category === 'Government Jobs').slice(0, 10);
          
          this.privateJobs = this.jobs.filter(job => 
            job.category !== 'Government Jobs' && 
            job.category !== 'Health and Career Tips' && 
            job.category !== 'TeluguToEnglishLearning' &&
            job.category !== 'Motivation Stories'
          ).slice(0, 10);

          // Get all jobs with walkInDrive flag set to true
          this.walkinJobs = this.jobs.filter(job => job.walkInDrive === true).slice(0, 10);

          this.tipsJobs = this.jobs.filter(job => job.category === 'Health and Career Tips').slice(0, 10);
          
          this.teluguJobs = this.jobs.filter(job => job.category === 'TeluguToEnglishLearning').slice(0, 10);

          this.currentAffairsJobs = this.jobs.filter(job => job.category === 'Current Affairs').slice(0, 10);

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

  getDayNumber(job: Job): number {
    if (job.category !== 'TeluguToEnglishLearning') return 0;
    
    const allTeluguJobs = this.jobs
      .filter(j => j.category === 'TeluguToEnglishLearning')
      .sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
      
    const index = allTeluguJobs.findIndex(j => j.id === job.id);
    return index !== -1 ? index + 1 : 0;
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
}
