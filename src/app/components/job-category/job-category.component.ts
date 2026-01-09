import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { onValue, ref } from 'firebase/database';
import { db } from '../../../config/firebase.config';

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

  private categoryMappings: { [key: string]: { title: string; category: string } } = {
    'all-latest-jobs': { title: 'All Latest Jobs', category: 'All Latest Jobs' },
    'it-software-jobs': { title: 'IT / Software Jobs', category: 'IT / Software Jobs' },
    'non-it-bpo-jobs': { title: 'Non-IT / BPO Jobs', category: 'Non-IT / BPO Jobs' },
    'government-jobs': { title: 'Government Jobs', category: 'Government Jobs' },
    'private-bank-jobs': { title: 'All Private/ Bank Jobs', category: 'All Private/ Bank Jobs' },
    'walk-in-drive-jobs': { title: 'Walk-in Drive/Internships Jobs', category: 'Walk-in Drive/Internships Jobs' }
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
          console.log('No data found in Firebase - loading sample data'); // Debug log
          this.loadSampleData();
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

  getFreshJobsCount(): number {
    return this.filteredJobs.filter(job => this.getDaysLeft(job.lastDate) > 3).length;
  }

  getUrgentJobsCount(): number {
    return this.filteredJobs.filter(job => {
      const daysLeft = this.getDaysLeft(job.lastDate);
      return daysLeft <= 3 && daysLeft >= 0;
    }).length;
  }

  loadSampleData() {
    // Sample data if Firebase is empty
    this.jobs = [
      {
        id: 'sample1',
        title: 'Senior Software Developer',
        company: 'Tech Solutions Ltd',
        category: 'IT / Software Jobs',
        type: 'Full-time',
        location: 'Bangalore',
        description: 'Develop and maintain web applications using modern technologies like Angular, React, and Node.js.',
        lastDate: '2026-01-30',
        createdDate: '2026-01-01'
      },
      {
        id: 'sample2',
        title: 'Data Analyst',
        company: 'Analytics Corp',
        category: 'IT / Software Jobs',
        type: 'Full-time',
        location: 'Mumbai',
        description: 'Analyze business data and provide insights to improve decision making using SQL, Python, and Power BI.',
        lastDate: '2026-01-25',
        createdDate: '2026-01-02'
      },
      {
        id: 'sample3',
        title: 'Government Clerk',
        company: 'State Government',
        category: 'Government Jobs',
        type: 'Full-time',
        location: 'Delhi',
        description: 'Handle administrative tasks and public service duties. Excellent opportunity for government career.',
        lastDate: '2026-02-15',
        createdDate: '2026-01-03'
      },
      {
        id: 'sample4',
        title: 'Customer Service Representative',
        company: 'BPO Solutions',
        category: 'Non-IT / BPO Jobs',
        type: 'Full-time',
        location: 'Hyderabad',
        description: 'Handle customer inquiries and provide excellent customer service in a fast-paced environment.',
        lastDate: '2026-01-28',
        createdDate: '2026-01-04'
      },
      {
        id: 'sample5',
        title: 'Bank Officer',
        company: 'National Bank',
        category: 'All Private/ Bank Jobs',
        type: 'Full-time',
        location: 'Chennai',
        description: 'Process banking transactions, customer service, and loan processing in a reputed banking institution.',
        lastDate: '2026-02-10',
        createdDate: '2026-01-05'
      },
      {
        id: 'sample6',
        title: 'Walk-in Interview - Sales Executive',
        company: 'Sales Corp',
        category: 'Walk-in Drive/Internships Jobs',
        type: 'Full-time',
        location: 'Pune',
        description: 'Immediate hiring for sales executives. Walk-in interview from 10 AM to 4 PM.',
        lastDate: '2026-01-20',
        createdDate: '2026-01-06'
      }
    ];

    const categoryMapping = this.categoryMappings[this.categoryParam];
    if (categoryMapping) {
      if (categoryMapping.category === 'All Latest Jobs') {
        this.filteredJobs = this.jobs;
      } else {
        this.filteredJobs = this.jobs.filter(job => job.category === categoryMapping.category);
      }
    }
    
    console.log('Sample data loaded and filtered:', this.filteredJobs);
    this.isLoading = false;
    this.cdr.detectChanges(); // Force change detection
  }

  // Method to get color class for job type badge
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

  // Navigate to job detail page
  viewJobDetails(job: Job) {
    this.router.navigate(['/job-details', job.id], { state: { job: job } });
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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return this.filteredJobs.filter(job => {
      const createdDate = new Date(job.createdDate);
      return createdDate >= sevenDaysAgo;
    }).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
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
}