import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Job } from '../../models/job.model';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.css'
})
export class JobDetailComponent implements OnInit {
  job: Job | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Get route parameters
    const jobId = this.route.snapshot.paramMap.get('id');
    const jobTitle = this.route.snapshot.paramMap.get('title');
    
    // Try to get job from router state first
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['job']) {
      this.job = navigation.extras.state['job'] as Job;
    } else {
      // If not in state, try to get from history.state
      if (history.state?.job) {
        this.job = history.state.job as Job;
      } else {
        // If job not found, redirect back
        console.log('Job not found in state, redirecting...', { jobId, jobTitle });
        this.router.navigate(['/all-latest-jobs']);
      }
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
      case 'IT / Software Jobs': 
        return 'badge-primary';
      case 'Non-IT / BPO Jobs': 
        return 'badge-secondary';
      case 'Government Jobs': 
        return 'badge-success';
      case 'All Private/ Bank Jobs': 
        return 'badge-warning';
      case 'Walk-in Drive/Internships Jobs': 
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
        text: `Check out this job opportunity at ${job.company}`,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Job link copied to clipboard!');
      });
    }
  }

  goBack() {
    window.history.back();
  }
}