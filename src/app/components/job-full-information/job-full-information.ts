import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Job } from '../../models/job.model';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../../../config/firebase.config';

@Component({
  selector: 'app-job-full-information',
  imports: [CommonModule, RouterModule],
  templateUrl: './job-full-information.html',
  styleUrl: './job-full-information.css',
})
export class JobFullInformation implements OnInit {
  job: Job | null = null;
  isLoading: boolean = true;
  latestJobs: Job[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    console.log('Job Full Information Component Initialized');
    this.isLoading = true;
    
    // Get route parameters
    const jobId = this.route.snapshot.paramMap.get('id');
    const jobTitle = this.route.snapshot.paramMap.get('title');
    
    console.log('Job Full Information - ID:', jobId, 'Title:', jobTitle);
    
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
        console.log('Job loaded from navigation state:', this.job?.title);
      } else {
        // If not in router state, fetch from Firebase
        console.log('Fetching job from Firebase...');
        await this.loadJobFromFirebase(jobId);
      }
      
      // Load latest jobs for sidebar
      await this.loadLatestJobs();
      
    } catch (error) {
      console.error('Error loading job:', error);
      this.job = null;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadJobFromFirebase(jobId: string): Promise<void> {
    try {
      const jobRef = ref(db, `jobs/${jobId}`);
      const snapshot = await get(jobRef);
      
      if (snapshot.exists()) {
        const jobData = snapshot.val();
        this.job = {
          id: jobId,
          ...jobData
        } as Job;
        console.log('Job loaded from Firebase:', this.job?.title);
      } else {
        console.log('Job not found in Firebase');
        this.job = null;
      }
    } catch (error) {
      console.error('Error loading job from Firebase:', error);
      this.job = null;
    }
  }

  private async loadLatestJobs(): Promise<void> {
    try {
      const jobsRef = ref(db, 'jobs');
      const recentJobsQuery = query(jobsRef, orderByChild('createdDate'), limitToLast(25));
      const snapshot = await get(recentJobsQuery);
      
      if (snapshot.exists()) {
        const jobsData = snapshot.val();
        this.latestJobs = Object.keys(jobsData)
          .map(key => ({ id: key, ...jobsData[key] }))
          .filter(job => job.id !== this.job?.id) // Exclude current job
          .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
          .slice(0, 20) as Job[];
        
        console.log('Latest jobs loaded:', this.latestJobs.length);
      } else {
        this.latestJobs = [];
        console.log('No jobs found for latest jobs');
      }
    } catch (error) {
      console.error('Error loading latest jobs:', error);
      this.latestJobs = [];
    }
  }

  viewJobDetails(job: Job) {
    const titleSlug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    this.router.navigate(['/job', job.id, titleSlug], { state: { job } }).then(() => {
      window.scrollTo(0, 0);
      this.ngOnInit(); // Reload the component
    });
  }

  trackByJobId(index: number, job: Job): string {
    return job.id;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  shareJob(job: Job) {
    const jobUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this amazing job opportunity!\n\nFollow our WhatsApp Channel: https://whatsapp.com/channel/0029Vb79LscKQuJM5YCwc51H\n\nSubscribe YouTube: https://www.youtube.com/@allindiajobs-newjobs`,
        url: jobUrl
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareText = `📌 ${job.title}\n\n🔗 ${jobUrl}\n\nCheck out this amazing job opportunity!\n\n📢 Follow our WhatsApp Channel: https://whatsapp.com/channel/0029Vb79LscKQuJM5YCwc51H\n\n📺 Subscribe YouTube: https://www.youtube.com/@allindiajobs-newjobs`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Job details copied to clipboard!');
      });
    }
  }

  shareOnWhatsApp(job: Job) {
    const jobUrl = window.location.href;
    
    const message = `
📌 *${job.title}*

🔗 ${jobUrl}

_Amazing job opportunity for you!_

📢 Follow our WhatsApp Channel: https://whatsapp.com/channel/0029Vb79LscKQuJM5YCwc51H

📺 Subscribe YouTube: https://www.youtube.com/@allindiajobs-newjobs
    `.trim();
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
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
    this.router.navigate(['/all-latest-jobs']);
  }
}
