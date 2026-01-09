import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

interface Job {
  id: string;
  title: string;
  company: string;
  category: string;
  type: string;
  location: string;
  description: string;
  lastDate: string;
  createdDate: string;
}

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

  getDaysLeft(lastDate: string): number {
    const today = new Date();
    const deadline = new Date(lastDate);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getStatusClass(daysLeft: number): string {
    if (daysLeft < 0) return 'text-danger';
    if (daysLeft <= 3) return 'text-warning';
    return 'text-success';
  }

  getStatusText(daysLeft: number): string {
    if (daysLeft < 0) return 'Application Expired';
    if (daysLeft === 0) return 'Last Day to Apply';
    if (daysLeft === 1) return '1 Day Left';
    if (daysLeft <= 3) return `${daysLeft} Days Left`;
    return `${daysLeft} Days Remaining`;
  }

  getJobTypeClass(jobType: string): string {
    switch (jobType.toLowerCase()) {
      case 'full-time': 
        return 'badge-primary';
      case 'part-time': 
        return 'badge-secondary';
      case 'contract': 
        return 'badge-warning';
      case 'internship': 
        return 'badge-info';
      case 'remote': 
        return 'badge-success';
      case 'freelance': 
        return 'badge-light';
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