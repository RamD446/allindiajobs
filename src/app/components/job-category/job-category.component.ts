import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { onValue, ref, get, update } from 'firebase/database';
import { db } from '../../../config/firebase.config';
import { Job, JobCareer, CAREER_JOB_TYPES } from '../../models/job.model';

@Component({
  selector: 'app-job-category',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-category.component.html',
  styleUrl: './job-category.component.css'
})
export class JobCategoryComponent implements OnInit {
  jobsPerPage: number = 10;
  currentPage: number = 1;
  jobs: Job[] = [];
  filteredJobs: Job[] = [];
  uniqueCompanies: string[] = [];
  selectedCompany: string = '';
  jobCareers: JobCareer[] = [];
  filteredCareers: JobCareer[] = [];
  careerJobTypes: string[] = [...CAREER_JOB_TYPES];
  selectedCareerType: string = 'IT Services MNC';
  categoryTitle: string = '';
  categoryParam: string = '';
  isLoading: boolean = true;
  categoryJobs: Job[] = []; // Store original category jobs

  private categoryMappings: { [key: string]: { title: string; category: string } } = {
    'IT Walk-ins': { title: 'IT Walk-ins', category: 'IT Walk-ins' },
    'BPO/Non-IT Walk-ins': { title: 'BPO/Non-IT Walk-ins', category: 'BPO/Non-IT Walk-ins' },
    'Fresher Walk-ins': { title: 'Fresher Walk-ins', category: 'Fresher Walk-ins' },
    'Sales Walk-ins': { title: 'Sales Walk-ins', category: 'Sales Walk-ins' },
    'Banking Walk-ins': { title: 'Banking Walk-ins', category: 'Banking Walk-ins' },
    'Pharma Walk-ins': { title: 'Pharma Walk-ins', category: 'Pharma Walk-ins' }
  };

  constructor(private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.route.url.subscribe(urlSegments => {
      const path = urlSegments.map(segment => segment.path).join('/');
      this.categoryParam = path;
      
      const mapping = this.categoryMappings[path];
      if (mapping) {
        this.categoryTitle = mapping.title;
        this.loadJobs(mapping.category);
      } else {
        this.categoryTitle = 'IT Walk-ins';
        this.loadJobs('IT Walk-ins');
      }
      this.loadJobCareers();
    });
  }

  loadJobs(category: string) {
    this.isLoading = true;
    this.currentPage = 1; 
    
    try {
      get(ref(db, 'stats/apiCalls')).then(snapshot => {
        const count = (snapshot.val() || 0) + 1;
        update(ref(db, 'stats'), { apiCalls: count });
      });
    } catch (e) { console.error('Error tracking API call:', e); }

    try {
      const jobsRef = ref(db, 'jobs');
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
          this.jobs = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          })).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
          
          if (category === 'BPO/Non-IT Walk-ins') {
            this.categoryJobs = this.jobs.filter(job => 
              job.category === 'BPO Walk-ins' || job.category === 'Non-IT Walk-ins' || job.category === 'BPO/Non-IT Walk-ins'
            );
          } else {
            this.categoryJobs = this.jobs.filter(job => job.category === category);
          }
          
          this.filteredJobs = [...this.categoryJobs];
          this.extractUniqueCompanies();
          
        } else {
          this.jobs = [];
          this.categoryJobs = [];
          this.filteredJobs = [];
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

  loadJobCareers() {
    try {
      const careersRef = ref(db, 'jobCareers');
      onValue(careersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.jobCareers = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          if (this.selectedCareerType) {
            this.filterCareersByType(this.selectedCareerType);
          }
        }
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error loading careers:', error);
    }
  }

  filterCareersByType(type: string) {
    this.selectedCareerType = type;
    this.filteredCareers = this.jobCareers.filter(career => career.jobType === type);
    this.cdr.detectChanges();
  }

  extractUniqueCompanies() {
    const companies = this.categoryJobs
      .map(job => job.company)
      .filter((company): company is string => !!company);
    this.uniqueCompanies = Array.from(new Set(companies)).sort();
  }

  filterByCompany(company: string) {
    this.selectedCompany = company;
    if (company) {
      this.filteredJobs = this.categoryJobs.filter(job => job.company === company);
    } else {
      this.filteredJobs = [...this.categoryJobs];
    }
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  getPrivateJobs(): Job[] {
    const start = (this.currentPage - 1) * this.jobsPerPage;
    const end = start + this.jobsPerPage;
    return this.filteredJobs.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredJobs.length / this.jobsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      window.scrollTo(0, 0);
    }
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
    try {
      get(ref(db, 'stats/jobClicks')).then(snapshot => {
        const count = (snapshot.val() || 0) + 1;
        update(ref(db, 'stats'), { jobClicks: count });
      });
    } catch (e) { console.error('Error tracking job click:', e); }

    const titleSlug = this.createSlug(job.title);
    this.router.navigate(['/job', job.id, titleSlug], { state: { job: job } }).then(() => {
      window.scrollTo(0, 0);
    });
  }
}
