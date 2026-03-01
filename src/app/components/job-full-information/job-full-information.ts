import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Job } from '../../models/job.model';
import { ref, get, query, orderByChild, limitToLast, update } from 'firebase/database';
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

    // Track Job Click on load
    try {
      get(ref(db, 'stats/jobClicks')).then(snapshot => {
        const count = (snapshot.val() || 0) + 1;
        update(ref(db, 'stats'), { jobClicks: count });
      });
    } catch (e) { console.error('Error tracking job click:', e); }
    
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
    // Track Job Click
    try {
      get(ref(db, 'stats/jobClicks')).then(snapshot => {
        const count = (snapshot.val() || 0) + 1;
        update(ref(db, 'stats'), { jobClicks: count });
      });
    } catch (e) { console.error('Error tracking job click:', e); }

    const titleSlug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    this.router.navigate(['/job', job.id, titleSlug], { state: { job } }).then(() => {
      window.scrollTo(0, 0);
      this.ngOnInit(); // Reload the component
    });
  }

  trackByJobId(index: number, job: Job): string {
    return job.id;
  }

  getRelatedJobs(): Job[] {
    if (!this.job || !this.latestJobs) return [];
    
    const isGov = this.job.category === 'Government Jobs';
    
    return this.latestJobs
      .filter(j => {
        if (isGov) {
          return j.category === 'Government Jobs';
        } else {
          return j.category !== 'Government Jobs' && j.category !== 'Health and Career Tips' && j.category !== 'Motivation Stories';
        }
      })
      .slice(0, 10);
  }

  getTopJobs(): Job[] {
    if (!this.latestJobs) return [];
    return this.latestJobs
      .filter(j => j.category !== 'Health and Career Tips' && j.category !== 'Motivation Stories')
      .slice(0, 10);
  }

  getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';

    if (diffMins < 60)
      return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

    // Less than 24 hours → Today
    if (diffHours < 24)
      return 'Today Posted';

    // 1 to 10 days
    if (diffDays <= 10)
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    // Older than 10 days → show full date
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  isRichText(description: string): boolean {
    if (!description) return false;
    return description.includes('&nbsp;');
  }

  hasDots(description: string): boolean {
    if (!description) return false;
    return description.includes('.');
  }

  getDescriptionList(description: string): string[] {
    if (!description) return [];
    
    // If no full stop exists, return the description as a single item
    if (!description.includes('.')) {
      return [description.trim()];
    }
    
    // Split the description by dots and trim segments
    const segments = description
      .split('.')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Group segments in pairs (two sentences per item)
    const grouped: string[] = [];
    for (let i = 0; i < segments.length; i += 2) {
      if (i + 1 < segments.length) {
        // Two sentences together, with dots added back
        grouped.push(`${segments[i]}. ${segments[i + 1]}.`);
      } else {
        // Single remaining sentence
        grouped.push(`${segments[i]}.`);
      }
    }
    
    return grouped;
  }

  getImportantNotesList(notes: string): string[] {
    if (!notes) return [];

    const normalized = notes
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\u00a0/g, ' ')
      .trim();

    if (!normalized) return [];

    return normalized
      .split(/\n+|\.(?=\s|$)/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  shareJob(job: Job) {
    const jobUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this amazing job opportunity!\n\nFollow our WhatsApp Channel: https://whatsapp.com/channel/0029VbCLJWjCRs1nIKjUlh3p\n\nSubscribe YouTube: https://www.youtube.com/@allindajobs`,
        url: jobUrl
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareText = `📌 ${job.title}\n\n🔗 ${jobUrl}\n\nCheck out this amazing job opportunity!\n\n📢 Follow our WhatsApp Channel: https://whatsapp.com/channel/0029VbCLJWjCRs1nIKjUlh3p Subscribe YouTube: https://www.youtube.com/@allindajobs`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Job details copied to clipboard!');
      });
    }
  }

  shareOnWhatsApp(job: Job) {
    const jobUrl = window.location.href;
    
    let messageParts: string[] = [
      `📌 *${job.title}*`,
      `🏢 *Company:* ${job.company}`,
      ``,
      `🔗 ${jobUrl}`
    ];
    
    // Add interview dates if they exist
    if (job.walkInStartDate) {
      messageParts.push(`📅 *Interview Start:* ${new Date(job.walkInStartDate).toLocaleDateString('en-GB')}`);
    }
    if (job.walkInEndDate) {
      messageParts.push(`📅 *Interview End:* ${new Date(job.walkInEndDate).toLocaleDateString('en-GB')}`);
    }
    if (job.lastDateToApply) {
      messageParts.push(`📅 *Last Date to Apply:* ${new Date(job.lastDateToApply).toLocaleDateString('en-GB')}`);
    }
    
    messageParts.push(``);
  
    messageParts.push(`_Amazing job opportunity for you!_`);
    
    const message = messageParts.join('\n');
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

  getCategoryClass(category: string): string {
    if (!category) return 'category-other';
    
    const normalizedCategory = category.toLowerCase().trim();
    
    // Map categories to CSS classes with category- prefix
    if (normalizedCategory.includes('government') || normalizedCategory.includes('सरकारी')) {
      return 'category-government';
    } else if (normalizedCategory.includes('private') || normalizedCategory.includes('प्राइवेट')) {
      return 'category-private';
    } else if (normalizedCategory.includes('bank') || normalizedCategory.includes('बैंक')) {
      return 'category-banking';
    } else if (normalizedCategory.includes('railway') || normalizedCategory.includes('रेलवे')) {
      return 'category-railway';
    } else if (normalizedCategory.includes('defence') || normalizedCategory.includes('defense') || normalizedCategory.includes('सेना')) {
      return 'category-defence';
    } else if (normalizedCategory.includes('teaching') || normalizedCategory.includes('teacher') || normalizedCategory.includes('शिक्षा')) {
      return 'category-teaching';
    } else if (normalizedCategory.includes('engineering') || normalizedCategory.includes('engineer') || normalizedCategory.includes('इंजीनियर')) {
      return 'category-engineering';
    } else if (normalizedCategory.includes('medical') || normalizedCategory.includes('doctor') || normalizedCategory.includes('चिकित्सा')) {
      return 'category-medical';
    } else if (normalizedCategory.includes('police') || normalizedCategory.includes('पुलिस')) {
      return 'category-police';
    } else if (normalizedCategory.includes('it') || normalizedCategory.includes('software') || normalizedCategory.includes('tech')) {
      return 'category-it';
    } else {
      return 'category-other';
    }
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

  navigateToCategory(category: string) {
    const routeMapping: { [key: string]: string } = {
      'Government Jobs': 'government-jobs',
      'All Private Jobs': 'private-jobs',
      'Walk-in Drives': 'walk-in-drives',
      'Banking Jobs': 'banking-jobs',
      'IT Jobs': 'it-jobs'
    };

    const route = routeMapping[category];
    if (route) {
      this.router.navigate([`/${route}`]);
    }
  }
}
