import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Job } from '../../models/job.model';
import { ref, get } from 'firebase/database';
import { db } from '../../../config/firebase.config';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.css'
})
export class JobDetailComponent implements OnInit {
  job: Job | null = null;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    console.log('Job Detail Component Initialized');
    this.isLoading = true;
    
    // Get route parameters
    const jobId = this.route.snapshot.paramMap.get('id');
    const jobTitle = this.route.snapshot.paramMap.get('title');
    
    console.log('Job Detail NgOnInit - ID:', jobId, 'Title:', jobTitle);
    
    if (!jobId) {
      console.log('No job ID found, redirecting...');
      this.isLoading = false;
      this.router.navigate(['/all-latest-jobs']);
      return;
    }
    
    try {
      // Try to get job from router state first
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras?.state?.['job']) {
        this.job = navigation.extras.state['job'] as Job;
        this.isLoading = false;
        console.log('Job loaded from navigation state:', this.job);
        return;
      }
      
      // If not in navigation state, try history state
      if (history.state?.job) {
        this.job = history.state.job as Job;
        this.isLoading = false;
        console.log('Job loaded from history state:', this.job);
        return;
      }
      
      // If no state, fetch from Firebase
      console.log('Loading job from Firebase with ID:', jobId);
      await this.loadJobFromFirebase(jobId);
      
    } catch (error) {
      console.error('Error in ngOnInit:', error);
      this.isLoading = false;
      this.router.navigate(['/all-latest-jobs']);
    }
  }

  async loadJobFromFirebase(jobId: string) {
    try {
      console.log('Attempting to load job from Firebase:', jobId);
      const jobRef = ref(db, `jobs/${jobId}`);
      const snapshot = await get(jobRef);
      
      if (snapshot.exists()) {
        const jobData = snapshot.val();
        this.job = {
          id: jobId,
          ...jobData
        } as Job;
        console.log('Job loaded successfully from Firebase:', this.job);
        this.isLoading = false;
        this.cdr.detectChanges(); // Force change detection
        console.log('Change detection triggered, isLoading:', this.isLoading);
      } else {
        console.error('Job not found in Firebase with ID:', jobId);
        this.isLoading = false;
        this.cdr.detectChanges();
        alert('Job not found. Redirecting to job listings...');
        this.router.navigate(['/all-latest-jobs']);
      }
    } catch (error) {
      console.error('Error loading job from Firebase:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
      alert('Error loading job details. Please try again later.');
      this.router.navigate(['/all-latest-jobs']);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
      console.log('Loading completed, isLoading set to false, change detection triggered');
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  // Method to get color class for job category badge
  getCategoryClass(category: string): string {
    switch (category) {
      case 'Government Jobs':
        return 'badge-success';
      case 'All Private Jobs':
        return 'badge-warning';
      case 'Walk-in Drives':
        return 'badge-info';
      default:
        return 'badge-primary';
    }
  }

  saveJob(job: Job) {
    console.log('Job saved/bookmarked:', job.title);
    alert(`Job "${job.title}" has been saved to your bookmarks!`);
  }

  applyForJob(job: Job) {
    console.log('Applying for job:', job.title);
    alert(`Application process initiated for "${job.title}"!`);
  }

  shareJob(job: Job) {
    console.log('Sharing job:', job.title);
    if (navigator.share) {
      navigator.share({
        title: job.title,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareText = `${job.title}\n${window.location.href}`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Job title and link copied to clipboard!');
      });
    }
  }

  copyLink(job: Job) {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Job link copied to clipboard!');
    }).catch(() => {
      alert('Unable to copy. Please copy the link manually.');
    });
  }

  openExternalChannel(url: string) {
    try {
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      window.location.href = url;
    }
  }

  goBack() {
    window.history.back();
  }
}