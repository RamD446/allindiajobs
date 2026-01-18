import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { onValue, ref } from 'firebase/database';
import { db } from '../../../config/firebase.config';
import { Job } from '../../models/job.model';

@Component({
  selector: 'app-job-category',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-category.component.html',
  styleUrl: './job-category.component.css'
})
export class JobCategoryComponent implements OnInit {
  jobs: Job[] = [];
  filteredJobs: Job[] = [];
  categoryTitle: string = '';
  categoryParam: string = '';
  isLoading: boolean = true;
  currentPage: number = 1;

  private categoryMappings: { [key: string]: { title: string; category: string } } = {
    'all-latest-jobs': { title: 'All Latest Jobs', category: 'All Latest Jobs' },
    'government-jobs': { title: 'Government Jobs', category: 'Government Jobs' },
    'private-jobs': { title: 'All Private Jobs', category: 'All Private Jobs' },
    'walk-in-drives': { title: 'Walk-in Drives', category: 'Walk-in Drives' }
  };

  constructor(private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.route.url.subscribe(urlSegments => {
      const path = urlSegments.map(segment => segment.path).join('/');
      this.categoryParam = path;
      
      console.log('Current route path:', path); // Debug log
      
      const mapping = this.categoryMappings[path];
      if (mapping) {
        this.categoryTitle = mapping.title;
        console.log('Loading jobs for category:', mapping.category); // Debug log
        this.loadJobs(mapping.category);
      } else {
        console.log('No mapping found for path:', path); // Debug log
        // Default to all latest jobs
        this.categoryTitle = 'All Latest Jobs';
        this.loadJobs('All Latest Jobs');
      }
    });
  }

  loadJobs(category: string) {
    this.isLoading = true;
    try {
      const jobsRef = ref(db, 'jobs');
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        console.log('Firebase data received:', data); // Debug log
        
        if (data) {
          this.jobs = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          
          console.log('All jobs loaded:', this.jobs); // Debug log
          
          // Filter jobs by category
          if (category === 'All Latest Jobs') {
            this.filteredJobs = this.jobs;
          } else {
            this.filteredJobs = this.jobs.filter(job => job.category === category);
          }
          
          console.log('Filtered jobs for', category, ':', this.filteredJobs); // Debug log
        } else {
          console.log('No data found in Firebase'); // Debug log
          this.jobs = [];
          this.filteredJobs = [];
        }
        
        console.log('Setting isLoading to false'); // Debug log
        this.isLoading = false;
        this.cdr.detectChanges(); // Force change detection
      }, (error) => {
        console.error('Firebase error:', error); // Error log
        this.isLoading = false;
        this.cdr.detectChanges(); // Force change detection
      });
    } catch (error) {
      console.error('Error loading jobs:', error);
      this.isLoading = false;
      this.cdr.detectChanges(); // Force change detection
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
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

  // Create URL-friendly slug from job title
  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Navigate to job detail page
  viewJobDetails(job: Job) {
    const titleSlug = this.createSlug(job.title);
    this.router.navigate(['/job-details', job.id, titleSlug], { state: { job: job } });
  }

  // Save/bookmark job functionality
  saveJob(job: Job) {
    console.log('Job saved/bookmarked:', job.title);
    // Here you can implement save functionality to local storage or Firebase
    // For now, we'll just show console log
    alert(`Job "${job.title}" has been saved to your bookmarks!`);
  }

  // Share job functionality
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
      const shareText = `Check out this job: ${job.title} at ${job.company}`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Job information copied to clipboard!');
      });
    }
  }

  // Get new jobs (created in last 7 days)
  getNewJobs(): Job[] {
    // Return all filtered jobs sorted by newest first
    return this.filteredJobs.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }

  // Get other jobs (older than 7 days)
  getOtherJobs(): Job[] {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return this.filteredJobs.filter(job => {
      const createdDate = new Date(job.createdDate);
      return createdDate < sevenDaysAgo;
    }).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }

  // Navigate to different job categories
  navigateToCategory(category: string) {
    const routeMapping: { [key: string]: string } = {
      'Government Jobs': 'government-jobs',
      'All Private Jobs': 'private-jobs',
      'Walk-in Drives': 'walk-in-drives'
    };

    const route = routeMapping[category];
    if (route) {
      this.router.navigate([`/${route}`]);
    }
  }
}