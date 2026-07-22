import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { onValue, ref } from 'firebase/database';
import { db } from '../../../config/firebase.config';
import { Job, CompanyImage, DEFAULT_JOB_CATEGORIES } from '../../models/job.model';

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
  selectedJobCategory: string = 'All';
  selectedFilterJobType: string = 'All';
  selectedFilterExperience: string = 'All';
  selectedFilterQualification: string = 'All';
  selectedFilterLocation: string = 'All';
  isLoading: boolean = true;
  isWalkinOnlyPage: boolean = false;
  isNonWalkinOnlyPage: boolean = false;
  companyImageMap: Record<string, string> = {};
  jobCategories: string[] = [...DEFAULT_JOB_CATEGORIES];
  jobTypeOptions: string[] = ['Walk-ins', 'Non-Walkins'];
  experienceOptions: string[] = ['Freshers', 'Experienced'];
  qualificationOptions: string[] = ['B.Tech', 'Degree', 'Any Graduate'];
  locationOptions: string[] = ['Vishakhapatnam', 'Hyderabad', 'Bengaluru'];
  private readonly categoryByPath: Record<string, string> = {
    '/IT-Walk-ins': 'IT Walk-ins',
    '/BPO-Non-IT-Walk-ins': 'BPO/Non-IT Walk-ins',
    '/Fresher-Walk-ins': 'Fresher Walk-ins',
    '/Sales-Walk-ins': 'Sales Walk-ins',
    '/Banking-Walk-ins': 'Banking Walk-ins',
    '/Pharma-Walk-ins': 'Pharma Walk-ins'
  };

  constructor(private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const currentPath = this.router.url.split('?')[0];
    const pathCategory = this.categoryByPath[currentPath] || null;

    this.isWalkinOnlyPage = currentPath.includes('/walkinjobs') || !!pathCategory;
    this.isNonWalkinOnlyPage = currentPath.includes('/non-walkinjobs');

    this.route.queryParamMap.subscribe((params) => {
      this.selectedJobCategory = params.get('category') || pathCategory || 'All';
      this.selectedFilterJobType = params.get('jobType') || 'All';
      this.selectedFilterExperience = params.get('experience') || 'All';
      this.selectedFilterQualification = params.get('education') || 'All';
      this.selectedFilterLocation = params.get('location') || 'All';

      this.cdr.detectChanges();
    });

    this.loadCompanyImages();
    this.loadJobs();
  }

  private getJobTypeFilteredList(jobs: Job[]): Job[] {
    if (this.isWalkinOnlyPage) {
      return jobs.filter(job => job.walkInDrive === true);
    }

    if (this.isNonWalkinOnlyPage) {
      return jobs.filter(job => job.walkInDrive !== true);
    }

    return jobs.filter(job => job.walkInDrive === true).slice(0, 16);
  }

  private getCreatedTimestamp(job: Job): number {
    const raw = (job.createdDate || '').toString().trim();
    if (!raw) {
      return 0;
    }

    const normalized = raw.includes('T') && raw.length === 16 ? `${raw}:00` : raw;
    const parsed = new Date(normalized).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private sortByLatestCreated(jobs: Job[]): Job[] {
    return [...jobs].sort((a, b) => this.getCreatedTimestamp(b) - this.getCreatedTimestamp(a));
  }

  private normalizeCompanyName(value: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  loadCompanyImages() {
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
            const normalizedName = this.normalizeCompanyName(item.companyName || '');
            if (normalizedName) {
              map[normalizedName] = item.companyImage || '';
            }
          }
        }

        this.companyImageMap = map;
        this.jobs = this.applyCompanyImageMapping(this.jobs);
        this.walkinJobs = this.applyCompanyImageMapping(this.walkinJobs);
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error loading company images on home:', error);
    }
  }

  private applyCompanyImageMapping(jobs: Job[]): Job[] {
    return jobs.map((job) => {
      const mappedImage = this.getMappedImageByCompany(job.company || '');
      const existingImageSrc = this.extractImageSrc(job.companyImage || '');
      if (mappedImage) {
        return {
          ...job,
          companyImage: mappedImage
        };
      }

      if (existingImageSrc) {
        return job;
      }

      if (!mappedImage) {
        return job;
      }

      return {
        ...job,
        companyImage: mappedImage
      };
    });
  }

  private getMappedImageByCompany(companyName: string): string {
    const key = this.normalizeCompanyName(companyName);
    if (!key) {
      return '';
    }

    if (this.companyImageMap[key]) {
      return this.companyImageMap[key];
    }

    const mapKeys = Object.keys(this.companyImageMap);

    const partialMatch = mapKeys.find((k) => key.includes(k) || k.includes(key));
    if (partialMatch) {
      return this.companyImageMap[partialMatch] || '';
    }

    return '';
  }

  loadJobs() {
    this.isLoading = true;
    try {
      const jobsRef = ref(db, 'jobs');
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const mappedJobs = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));

          this.jobs = this.sortByLatestCreated(this.applyCompanyImageMapping(mappedJobs));
          this.walkinJobs = this.sortByLatestCreated(this.getJobTypeFilteredList(this.jobs));

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

  getFilteredJobsForHome(): Job[] {
    return this.sortByLatestCreated(
      this.walkinJobs.filter((job) => {
        const categoryPass = this.selectedJobCategory === 'All' || job.category === this.selectedJobCategory;
        const jobTypePass = this.selectedFilterJobType === 'All' || (job.jobType || '') === this.selectedFilterJobType;
        const experiencePass = this.selectedFilterExperience === 'All' || (job.experience || '') === this.selectedFilterExperience;
        const qualificationPass = this.selectedFilterQualification === 'All' || (job.qualification || '') === this.selectedFilterQualification;

        const rawLocation = ((job.location || '') || (job.jobLocation || '')).toLowerCase();
        const locationPass = this.selectedFilterLocation === 'All' || rawLocation.includes(this.selectedFilterLocation.toLowerCase());

        return categoryPass && jobTypePass && experiencePass && qualificationPass && locationPass;
      })
    );
  }

  getCategoryCount(category: string): number {
    if (category === 'All') {
      return this.walkinJobs.length;
    }

    return this.walkinJobs.filter((job) => job.category === category).length;
  }

  selectCategoryTab(category: string) {
    this.selectedJobCategory = category;
    this.selectedFilterJobType = 'All';
    this.selectedFilterExperience = 'All';
    this.selectedFilterQualification = 'All';
    this.selectedFilterLocation = 'All';
    this.syncFiltersToQueryParams();
  }

  onIndependentFilterChange(changedFilter: 'jobType' | 'experience' | 'qualification' | 'location') {
    this.selectedJobCategory = 'All';

    if (changedFilter !== 'jobType') {
      this.selectedFilterJobType = 'All';
    }

    if (changedFilter !== 'experience') {
      this.selectedFilterExperience = 'All';
    }

    if (changedFilter !== 'qualification') {
      this.selectedFilterQualification = 'All';
    }

    if (changedFilter !== 'location') {
      this.selectedFilterLocation = 'All';
    }
  }

  applyIndependentFilter(changedFilter: 'jobType' | 'experience' | 'qualification' | 'location', value: string) {
    this.onIndependentFilterChange(changedFilter);

    if (changedFilter === 'jobType') {
      this.selectedFilterJobType = value;
      this.syncFiltersToQueryParams();
      return;
    }

    if (changedFilter === 'experience') {
      this.selectedFilterExperience = value;
      this.syncFiltersToQueryParams();
      return;
    }

    if (changedFilter === 'qualification') {
      this.selectedFilterQualification = value;
      this.syncFiltersToQueryParams();
      return;
    }

    this.selectedFilterLocation = value;
    this.syncFiltersToQueryParams();
  }

  private syncFiltersToQueryParams() {
    const queryParams: Record<string, string | null> = {
      category: this.selectedJobCategory !== 'All' ? this.selectedJobCategory : null,
      jobType: this.selectedFilterJobType !== 'All' ? this.selectedFilterJobType : null,
      experience: this.selectedFilterExperience !== 'All' ? this.selectedFilterExperience : null,
      education: this.selectedFilterQualification !== 'All' ? this.selectedFilterQualification : null,
      location: this.selectedFilterLocation !== 'All' ? this.selectedFilterLocation : null
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams
    });
  }

  getJobTypeFilterOptions(): string[] {
    return this.getUniqueFilterOptions(this.walkinJobs.map((job) => job.jobType), this.jobTypeOptions);
  }

  getExperienceFilterOptions(): string[] {
    return this.getUniqueFilterOptions(this.walkinJobs.map((job) => job.experience), this.experienceOptions);
  }

  getQualificationFilterOptions(): string[] {
    return this.getUniqueFilterOptions(this.walkinJobs.map((job) => job.qualification), this.qualificationOptions);
  }

  getLocationFilterOptions(): string[] {
    const locations = this.walkinJobs
      .map((job) => (job.location || '').trim())
      .filter((value) => value.length > 0);

    return this.getUniqueFilterOptions(locations, this.locationOptions);
  }

  private getUniqueFilterOptions(values: Array<string | undefined>, preferred: string[] = []): string[] {
    const set = new Set<string>();

    preferred.forEach((item) => {
      const trimmed = (item || '').trim();
      if (trimmed) {
        set.add(trimmed);
      }
    });

    values.forEach((item) => {
      const trimmed = (item || '').trim();
      if (trimmed) {
        set.add(trimmed);
      }
    });

    return Array.from(set);
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

  getJobCardImage(job: Job): string | null {
    const mapped = this.getMappedImageByCompany(job.company || '');
    const mappedSrc = this.extractImageSrc(mapped);
    if (mappedSrc) {
      return mappedSrc;
    }

    const direct = this.extractImageSrc(job.companyImage || '');
    return direct;
  }

  getJobDescriptionPreview(job: Job, maxLength: number = 100): string {
    const cleanText = (job.description || '').replace(/\s+/g, ' ').trim();
    if (!cleanText) {
      return 'No description available';
    }

    if (cleanText.length <= maxLength) {
      return cleanText;
    }

    return `${cleanText.slice(0, maxLength)}...`;
  }

  getTodayWalkinsCount(): number {
    return this.jobs.filter(job => this.isWalkInToday(job)).length;
  }

  isWalkInToday(job: Job): boolean {
    return job.walkInDrive === true;
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
    return this.getFilteredJobsForHome().length === 0;
  }
}
