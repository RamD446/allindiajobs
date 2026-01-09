import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, push, remove, onValue, off } from 'firebase/database';
import { auth, db } from '../../../config/firebase.config';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  currentUser: any = null;
  jobs: any[] = [];
  totalJobs = 0;
  todayJobs = 0;
  activeJobs = 0;
  
  // Modal states
  showCreateModal = false;
  showViewModal = false;
  selectedJob: any = null;
  isCreatingJob = false;
  
  // Forms
  createJobForm: FormGroup;
  
  private auth = auth;
  private db = db;

  constructor(private fb: FormBuilder, private router: Router) {
    this.createJobForm = this.fb.group({
      title: ['', [Validators.required]],
      subtitle: [''],
      company: ['', [Validators.required]],
      jobType: ['Full-time', [Validators.required]],
      jobCategory: ['Government', [Validators.required]],
      createdDate: [this.getCurrentDate(), [Validators.required]],
      lastDate: ['', [Validators.required]],
      content: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    console.log('Admin component initialized - loading data immediately');
    this.initializeAdminPanel();
  }

  private async initializeAdminPanel() {
    // Check session storage first
    const sessionUser = this.getSessionUser();
    if (sessionUser) {
      console.log('Session user found, setting up admin panel...');
      this.currentUser = {
        uid: sessionUser.uid,
        email: sessionUser.email,
        displayName: sessionUser.displayName
      };
      this.loadJobsImmediately();
      return;
    }
    
    // Check Firebase auth as backup
    if (this.auth.currentUser) {
      console.log('Firebase user found, setting up admin panel...');
      this.currentUser = this.auth.currentUser;
      this.storeUserSession(this.auth.currentUser);
      this.loadJobsImmediately();
      return;
    }
    
    // Wait a moment for Firebase to initialize
    onAuthStateChanged(this.auth, (user: any) => {
      if (user) {
        console.log('Auth state changed - user found, loading panel...');
        this.currentUser = user;
        this.storeUserSession(user);
        this.loadJobsImmediately();
      } else if (!this.getSessionUser()) {
        console.log('No authenticated user found, redirecting to login...');
        this.router.navigate(['/login']);
      }
    });
  }

  private loadJobsImmediately() {
    console.log('Loading jobs immediately from Firebase...');
    const jobsRef = ref(this.db, 'jobs');
    
    onValue(jobsRef, (snapshot: any) => {
      console.log('Jobs data received:', snapshot.exists());
      
      // Reset data
      this.jobs = [];
      this.totalJobs = 0;
      this.todayJobs = 0;
      this.activeJobs = 0;
      
      if (snapshot.exists()) {
        const jobsData = snapshot.val();
        const today = new Date().toISOString().split('T')[0];
        
        // Process all jobs
        Object.keys(jobsData).forEach((key) => {
          const job = { id: key, ...jobsData[key] };
          this.jobs.push(job);
        });
        
        // Sort by creation date (newest first)
        this.jobs.sort((a: any, b: any) => {
          const dateA = new Date(a.createdDate || a.createdAt || a.postedAt).getTime();
          const dateB = new Date(b.createdDate || b.createdAt || b.postedAt).getTime();
          return dateB - dateA;
        });
        
        // Calculate stats
        this.totalJobs = this.jobs.length;
        this.todayJobs = this.jobs.filter(job => {
          const jobDate = (job.createdDate || job.createdAt || job.postedAt);
          return jobDate && jobDate.startsWith(today);
        }).length;
        
        this.activeJobs = this.jobs.filter(job => {
          const lastDate = new Date(job.lastDate || job.applyLastDate);
          return lastDate >= new Date();
        }).length;
        
        console.log(`Loaded ${this.totalJobs} jobs, ${this.todayJobs} today, ${this.activeJobs} active`);
      } else {
        console.log('No jobs found in database');
      }
    }, (error) => {
      console.error('Error loading jobs:', error);
    });
  }

  // Session storage methods
  private storeUserSession(user: any) {
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      timestamp: Date.now()
    };
    sessionStorage.setItem('auth_user', JSON.stringify(userData));
    sessionStorage.setItem('auth_status', 'authenticated');
  }

  private getSessionUser() {
    try {
      const userStr = sessionStorage.getItem('auth_user');
      const authStatus = sessionStorage.getItem('auth_status');
      
      if (userStr && authStatus === 'authenticated') {
        const userData = JSON.parse(userStr);
        // Check if session is not too old (24 hours)
        const sessionAge = Date.now() - userData.timestamp;
        if (sessionAge < 24 * 60 * 60 * 1000) {
          return userData;
        } else {
          // Session expired, clear it
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error reading session:', error);
      this.clearSession();
    }
    return null;
  }

  private clearSession() {
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_status');
  }

  private getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.clearSession();
      console.log('Logout successful');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if Firebase logout fails, clear session and redirect
      this.clearSession();
      this.router.navigate(['/login']);
    }
  }

  async deleteJob(jobId: string, jobTitle?: string) {
    const title = jobTitle || 'this job';
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        const jobRef = ref(this.db, `jobs/${jobId}`);
        await remove(jobRef);
        
        // Remove from local array immediately for instant UI update
        this.jobs = this.jobs.filter(job => job.id !== jobId);
        this.updateJobStats();
        
        console.log(`Job ${jobId} deleted successfully`);
        alert('Job deleted successfully!');
      } catch (error: any) {
        console.error('Error deleting job:', error);
        alert('Error deleting job: ' + error.message);
      }
    }
  }
  
  private updateJobStats() {
    const today = new Date().toISOString().split('T')[0];
    
    this.totalJobs = this.jobs.length;
    this.todayJobs = this.jobs.filter(job => {
      const jobDate = (job.createdDate || job.createdAt || job.postedAt);
      return jobDate && jobDate.startsWith(today);
    }).length;
    
    this.activeJobs = this.jobs.filter(job => {
      const lastDate = new Date(job.lastDate || job.applyLastDate);
      return lastDate >= new Date();
    }).length;
  }

  formatDate(dateValue: string | number): string {
    if (typeof dateValue === 'number') {
      return new Date(dateValue).toLocaleDateString();
    }
    return new Date(dateValue).toLocaleDateString();
  }

  // Modal functions
  openCreateModal() {
    this.showCreateModal = true;
    this.createJobForm.reset();
    this.createJobForm.patchValue({
      jobType: 'Full-time',
      jobCategory: 'Government',
      createdDate: this.getCurrentDate()
    });
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.createJobForm.reset();
    this.isCreatingJob = false;
  }

  openViewModal(job: any) {
    this.selectedJob = job;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedJob = null;
  }

  async onCreateJob() {
    if (this.createJobForm.valid && !this.isCreatingJob) {
      this.isCreatingJob = true;
      
      try {
        const formData = this.createJobForm.value;
        const jobData = {
          title: formData.title,
          subtitle: formData.subtitle || '',
          company: formData.company,
          jobType: formData.jobType,
          jobCategory: formData.jobCategory,
          category: formData.jobCategory,
          lastDate: formData.lastDate,
          applyLastDate: formData.lastDate,
          createdDate: formData.createdDate,
          content: formData.content,
          qualifications: formData.content,
          email: this.currentUser?.email || 'admin@allindiajobs.com',
          contact: this.currentUser?.email || 'admin@allindiajobs.com',
          createdBy: this.currentUser?.email || 'Admin',
          createdAt: new Date().toISOString(),
          postedAt: formData.createdDate
        };

        const jobsRef = ref(this.db, 'jobs');
        const newJobRef = await push(jobsRef, jobData);
        
        // Add to local array immediately for instant UI update
        const newJob = { id: newJobRef.key, ...jobData };
        this.jobs.unshift(newJob); // Add to beginning
        this.updateJobStats();
        
        console.log('Job created successfully');
        this.closeCreateModal();
        alert('Job created successfully!');
      } catch (error: any) {
        console.error('Error creating job:', error);
        alert('Error creating job: ' + error.message);
      } finally {
        this.isCreatingJob = false;
      }
    }
  }
}