import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../config/firebase.config';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.css']
})
export class JobDetailComponent implements OnInit {
  job: any = null;
  jobId: string = '';
  
  private db = db;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.jobId = params['id'];
      console.log('Job Detail - ID:', this.jobId);
      
      if (this.jobId) {
        this.loadJobDetails();
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  loadJobDetails() {
    console.log('Loading job details for ID:', this.jobId);
    const jobRef = ref(this.db, `jobs/${this.jobId}`);
    
    onValue(jobRef, (snapshot: any) => {
      if (snapshot.exists()) {
        this.job = { id: this.jobId, ...snapshot.val() };
        console.log('Job details loaded:', this.job.title || this.job.jobTitle);
      } else {
        console.log('Job not found');
        this.job = null;
      }
    }, (error) => {
      console.error('Error loading job details:', error);
    });
  }

  formatDate(dateValue: string | number): string {
    if (!dateValue) return 'N/A';
    if (typeof dateValue === 'number') {
      return new Date(dateValue).toLocaleDateString();
    }
    return new Date(dateValue).toLocaleDateString();
  }

  isJobActive(): boolean {
    if (!this.job) return false;
    const lastDate = new Date(this.job.lastDate || this.job.applyLastDate);
    return lastDate >= new Date();
  }

  goBack() {
    this.router.navigate(['/']);
  }
}