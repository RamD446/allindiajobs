import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../config/firebase.config';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  jobs: any[] = [];
  isLoading = true;
  
  private db = db;

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadAllJobs();
  }

  loadAllJobs() {
    console.log('Loading all jobs for home page...');
    const jobsRef = ref(this.db, 'jobs');
    
    onValue(jobsRef, (snapshot: any) => {
      this.jobs = [];
      
      if (snapshot.exists()) {
        const jobsData = snapshot.val();
        
        // Process all jobs
        Object.keys(jobsData).forEach((key) => {
          const job = { id: key, ...jobsData[key] };
          this.jobs.push(job);
        });
        
        // Sort by creation date (newest first)
        this.jobs.sort((a: any, b: any) => {
          const dateA = new Date(a.createdDate || a.createdAt || a.postedAt).getTime();
          const dateB = new Date(b.createdDate || b.createdAt || b.postedAt).getTime();
          return dateB - dateA;
        });
        
        console.log(`Loaded ${this.jobs.length} jobs for home page`);
      } else {
        console.log('No jobs found');
      }
      
      this.isLoading = false;
    }, (error) => {
      console.error('Error loading jobs:', error);
      this.isLoading = false;
    });
  }

  viewJobDetails(job: any) {
    console.log('Navigating to job details:', job.id);
    this.router.navigate(['/job', job.id]);
  }

  formatDate(dateValue: string | number): string {
    if (!dateValue) return 'N/A';
    if (typeof dateValue === 'number') {
      return new Date(dateValue).toLocaleDateString();
    }
    return new Date(dateValue).toLocaleDateString();
  }

  getContentPreview(content: string): string {
    if (!content) return 'No description available';
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  }

  isJobActive(job: any): boolean {
    const lastDate = new Date(job.lastDate || job.applyLastDate);
    return lastDate >= new Date();
  }
}
