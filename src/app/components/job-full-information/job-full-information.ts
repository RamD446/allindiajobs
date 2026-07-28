import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Job, CompanyImage, DEFAULT_JOB_CATEGORIES, getCategoryDisplayLabel } from '../../models/job.model';
import { ref, get, onValue, query, orderByChild, limitToLast, update } from 'firebase/database';
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
  private companyImageMap: Record<string, string> = {};
  jobCategories: string[] = [...DEFAULT_JOB_CATEGORIES];
  readonly quickFilterCategories: string[] = [
    'Walk-ins',
    'Non-Walkins',
    'B.Tech',
    'Degree',
    'Any Graduate',
    'Freshers',
    'Experienced',
    'Vishakhapatnam',
    'Hyderabad',
    'Bengaluru'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    console.log('Job Full Information Component Initialized');
    this.isLoading = true;
    this.loadCompanyImages();
    
    // Get route parameters
    const jobId = this.route.snapshot.paramMap.get('id');
    const jobTitle = this.route.snapshot.paramMap.get('title');
    
    console.log('Job Full Information - ID:', jobId, 'Title:', jobTitle);
    
    if (!jobId) {
      console.log('No job ID found, redirecting...');
      this.isLoading = false;
      this.router.navigate(['/']);
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

  private loadCompanyImages(): void {
    try {
      const companyImagesRef = ref(db, 'companyImages');
      onValue(companyImagesRef, (snapshot) => {
        const data = snapshot.val();
        const map: Record<string, string> = {};
        if (data) {
          const rows = Object.keys(data).map((key) => ({
            id: key,
            ...data[key]
          })) as CompanyImage[];
          for (const item of rows) {
            const key = this.normalizeCompanyName(item.companyName || '');
            if (key) {
              map[key] = item.companyImage || '';
            }
          }
        }
        this.companyImageMap = map;
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error loading company images:', error);
    }
  }

  private normalizeCompanyName(value: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private getMappedImageByCompany(companyName: string): string {
    const key = this.normalizeCompanyName(companyName);
    if (!key) { return ''; }
    if (this.companyImageMap[key]) {
      return this.companyImageMap[key];
    }
    const mapKeys = Object.keys(this.companyImageMap);
    const partialMatch = mapKeys.find((k) => key.includes(k) || k.includes(key));
    return partialMatch ? (this.companyImageMap[partialMatch] || '') : '';
  }

  private async loadLatestJobs(): Promise<void> {
    try {
      const jobsRef = ref(db, 'jobs');
      const recentJobsQuery = query(jobsRef, orderByChild('createdDate'), limitToLast(50));
      const snapshot = await get(recentJobsQuery);
      
      if (snapshot.exists()) {
        const jobsData = snapshot.val();
        this.latestJobs = Object.keys(jobsData)
          .map(key => ({ id: key, ...jobsData[key] }))
          .filter(job => job.id !== this.job?.id) // Exclude current job
          .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
          .slice(0, 40) as Job[];
        
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
      this.ngOnInit(); // Reload the component
    });
  }

  trackByJobId(index: number, job: Job): string {
    return job.id;
  }

  getRelatedJobs(): Job[] {
    if (!this.job || !this.latestJobs) return [];
    
    // Filter by the exact same category as the current job
    return this.latestJobs
      .filter(j => j.category === this.job?.category)
      .slice(0, 10);
  }

  getTopJobs(): Job[] {
    if (!this.latestJobs) return [];
    
    // Show only top 5 recent posts in sidebar
    return this.latestJobs.slice(0, 5);
  }

  getAllCategoryFilters(): string[] {
    const set = new Set<string>(['All']);

    this.quickFilterCategories.forEach((item) => set.add(item));
    this.jobCategories.forEach((item) => {
      const trimmed = (item || '').trim();
      if (trimmed) {
        set.add(trimmed);
      }
    });

    return Array.from(set);
  }

  getCategoryDisplayLabel(category: string): string {
    return getCategoryDisplayLabel(category);
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

  formatWalkInDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
        return '';
      }

      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long'
      });
    } catch (e) {
      return '';
    }
  }

  private extractImageSrc(value: string): string | null {
    const raw = (value || '').trim();
    if (!raw) {
      return null;
    }

    const match = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1];
    }

    if (raw.startsWith('data:image/')) {
      return raw;
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    return null;
  }

  getRecentPostImage(job: Job): string | null {
    const mapped = this.getMappedImageByCompany(job.company || '');
    return this.extractImageSrc(mapped) || 'assets/images/logo.png';
  }

  getTopJobImage(job: Job): string | null {
    const mapped = this.getMappedImageByCompany(job.company || '');
    return this.extractImageSrc(mapped) || 'assets/images/logo.png';
  }

  getSafeHtml(html: string): SafeHtml {
    const cleaned = (html || '')
      .replace(/<wbr\s*\/?\s*>/gi, '')
      .replace(/&shy;/gi, '')
      .replace(/&#173;/gi, '')
      .replace(/\u00ad/g, '')
      .replace(/&#8203;/gi, '')
      .replace(/&ZeroWidthSpace;/gi, '')
      .replace(/\u200b/g, '')
      .replace(/\u200c/g, '')
      .replace(/\u200d/g, '')
      .replace(/\u2060/g, '')
      .replace(/\ufeff/g, '');

    return this.sanitizer.bypassSecurityTrustHtml(cleaned);
  }

  hasRenderableHtmlContent(html?: string): boolean {
    if (!html) {
      return false;
    }

    const normalized = html
      .replace(/<wbr\s*\/?\s*>/gi, '')
      .replace(/<p><br><\/p>/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .trim();

    return normalized.length > 0;
  }

  getFullInfoImages(html: string): string[] {
    if (!html) return [];
    const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    return matches.map(match => match[1]).filter(Boolean);
  }

  parseFullInfo(text: string): { label: string, value: string }[] {
    if (!text) return [];

    const normalized = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\u00a0/g, ' ')
      .trim();

    if (!normalized) {
      return [];
    }

    const knownLabels = new Set([
      'organization',
      'post name',
      'notification no',
      'total vacancies',
      'job type',
      'mode of application',
      'application mode',
      'official website',
      'official link',
      'start date',
      'last date',
      'salary'
    ]);

    const rows: { label: string, value: string }[] = [];
    const lines = normalized
      .split(/\r\n|\r|\n/)
      .map(line => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      const match = line.match(/^([^:]{2,80}?)\s*:\s*(.+)$/);
      if (!match) {
        continue;
      }

      const label = (match[1] || '').replace(/\s+/g, ' ').trim();
      const value = (match[2] || '').replace(/\s+/g, ' ').trim();

      if (!label || !value) {
        continue;
      }

      const normalizedLabel = label.toLowerCase();
      const isKnownLabel = knownLabels.has(normalizedLabel);
      const isShortGenericLabel = !isKnownLabel && label.length <= 35;

      if (isKnownLabel || isShortGenericLabel) {
        rows.push({ label, value });
      }
    }

    return rows;
  }

  getStructuredInfoRows(text: string): { label: string, value: string }[] {
    return this.parseFullInfo(text);
  }

  isRichText(description: string): boolean {
    if (!description) return false;
    return description.includes('&nbsp;');
  }

  getParagraphs(text: string): string[] {
    if (!text) return [];

    const normalized = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\u00a0/g, ' ')
      .trim();

    if (!normalized) return [];

    return normalized
      .split(/\r\n|\r|\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
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

  getDetailList(notes: string): string[] {
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
        text: `${job.title}\n\nCheck out this amazing job opportunity!\n\nShare this with those searching for jobs\n\nAllIndiaJobs Portal`,
        url: jobUrl
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareText = `${job.title}\n\nLink: ${jobUrl}\n\nCheck out this amazing job opportunity!\n\nShare this with those searching for jobs\n\nAllIndiaJobs Portal`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Job details copied to clipboard!');
      });
    }
  }

  shareOnWhatsApp(job: Job) {
    const jobUrl = window.location.href;

    let messageParts: string[] = [
      `*JOB OPPORTUNITY*`,
      ``,
      `*Position :* ${job.title}`,
    ];

    if (job.company) {
      messageParts.push(`*Company :* ${job.company}`);
    }
    if (job.experience) {
      messageParts.push(`*Experience :* ${job.experience}`);
    }
    if (job.jobLocation) {
      messageParts.push(`*Job Location & HR Details :* ${job.jobLocation}`);
    }

    messageParts.push(``);
    messageParts.push(`*Apply / Full Details :*`);
    messageParts.push(jobUrl);
    messageParts.push(``);
    messageParts.push(`Join our WhatsApp Group for more updates:`);
    messageParts.push(`https://whatsapp.com/channel/0029VbCLJWjCRs1nIKjUlh3p`);
    messageParts.push(``);
    messageParts.push(`Kindly forward to eligible candidates.`);
    messageParts.push(``);
    messageParts.push(`*AllIndiaJobs Portal*`);
    
    const message = messageParts.join('\n');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  }

  joinWhatsAppGroup() {
    window.open('https://whatsapp.com/channel/0029VbCLJWjCRs1nIKjUlh3p', '_blank');
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
    this.router.navigate(['/']);
  }

  navigateToCategory(category: string) {
    const routeMapping: { [key: string]: string } = {
      'IT Walk-ins': 'IT-Walk-ins',
      'BPO/Non-IT Walk-ins': 'BPO-Non-IT-Walk-ins',
      'Sales Walk-ins': 'Sales-Walk-ins',
      'Banking Walk-ins': 'Banking-Walk-ins',
      'Pharma Walk-ins': 'Pharma-Walk-ins'
    };

    const route = routeMapping[category];
    if (route) {
      this.router.navigate([`/${route}`]);
    }
  }
}
