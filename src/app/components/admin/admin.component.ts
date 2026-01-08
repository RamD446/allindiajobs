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
      createdDate: [this.getCurrentDate(), [Validators.required]],
      lastDate: ['', [Validators.required]],
      content: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    console.log('Admin component initialized');
    
    // Check session storage first for immediate user data
    const sessionUser = this.getSessionUser();
    if (sessionUser) {
      console.log('User found in session, loading data immediately...');
      this.currentUser = {
        uid: sessionUser.uid,
        email: sessionUser.email,
        displayName: sessionUser.displayName
      };
      this.loadJobs();
    }
    
    // Wait for auth to initialize properly as backup
    setTimeout(() => {
      if (this.auth.currentUser && !this.currentUser) {
        console.log('User authenticated via Firebase, loading data...');
        this.currentUser = this.auth.currentUser;
        this.storeUserSession(this.auth.currentUser);
        this.loadJobs();
      }
    }, 100);
    
    // Also listen for auth state changes
    onAuthStateChanged(this.auth, (user: any) => {
      console.log('Auth state changed:', user);
      if (user && !this.currentUser) {
        console.log('User authenticated, loading admin dashboard...');
        this.currentUser = user;
        this.storeUserSession(user);
        this.loadJobs();
      } else if (!user && !this.getSessionUser()) {
        console.log('User is not authenticated, redirecting to login...');
        this.currentUser = null;
        this.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }

  onLoginSuccess(user: any) {
    this.currentUser = user;
    this.loadJobs();
  }

  async logout() {
    try {
      // Clear session storage first
      this.clearSession();
      
      // Then sign out from Firebase
      await signOut(this.auth);
      console.log('Logout successful, navigating to login page...');
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if Firebase logout fails, clear session and redirect
      this.clearSession();
      this.router.navigate(['/login']);
    }
  }

  private getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
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

  loadJobs() {
    console.log('Loading jobs from Firebase...');
    
    // Ensure user is authenticated (check both current user and session)
    const sessionUser = this.getSessionUser();
    if (!this.currentUser && !this.auth.currentUser && !sessionUser) {
      console.log('No authenticated user, cannot load jobs');
      this.router.navigate(['/login']);
      return;
    }
    
    // Set current user if not already set
    if (!this.currentUser) {
      if (this.auth.currentUser) {
        this.currentUser = this.auth.currentUser;
      } else if (sessionUser) {
        this.currentUser = {
          uid: sessionUser.uid,
          email: sessionUser.email,
          displayName: sessionUser.displayName
        };
      }
    }
    
    try {
      const jobsRef = ref(this.db, 'jobs');
      
      // Clear existing data first
      this.jobs = [];
      this.totalJobs = 0;
      this.todayJobs = 0;
      this.activeJobs = 0;
      
      onValue(jobsRef, (snapshot: any) => {
        console.log('Jobs data received from Firebase:', snapshot.exists());
        
        this.jobs = [];
        let totalJobs = 0;
        let todayJobs = 0;
        let activeJobs = 0;
        const today = new Date().toDateString();

        if (snapshot.exists()) {
          const jobsData = snapshot.val();
          console.log('Processing jobs data:', Object.keys(jobsData).length, 'jobs found');
          
          Object.keys(jobsData).forEach((key) => {
            const job = { id: key, ...jobsData[key] } as any;
            this.jobs.push(job);
            
            const jobDate = new Date(job.createdAt || job.postedAt);
            const lastDate = new Date(job.applyLastDate || job.lastDate);
            const isActive = lastDate >= new Date();

            totalJobs++;
            if (jobDate.toDateString() === today) todayJobs++;
            if (isActive) activeJobs++;
          });
          
          // Sort jobs by creation date (newest first)
          this.jobs.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.postedAt).getTime();
            const dateB = new Date(b.createdAt || b.postedAt).getTime();
            return dateB - dateA;
          });
        } else {
          console.log('No jobs found in database');
        }

        // Update counts immediately
        this.totalJobs = totalJobs;
        this.todayJobs = todayJobs;
        this.activeJobs = activeJobs;
        
        console.log('Jobs loaded successfully:', {
          total: this.totalJobs,
          today: this.todayJobs,
          active: this.activeJobs,
          jobs: this.jobs.length
        });
        
        // Force change detection
        setTimeout(() => {
          console.log('Final job counts:', {
            total: this.totalJobs,
            today: this.todayJobs,
            active: this.activeJobs
          });
        }, 100);
        
      }, (error: any) => {
        console.error('Firebase onValue error:', error);
        // Set default values on error
        this.jobs = [];
        this.totalJobs = 0;
        this.todayJobs = 0;
        this.activeJobs = 0;
      });
    } catch (error: any) {
      console.error('Error setting up jobs listener:', error);
      // Set default values on error
      this.jobs = [];
      this.totalJobs = 0;
      this.todayJobs = 0;
      this.activeJobs = 0;
    }
  }

  async deleteJob(jobId: string) {
    if (confirm('Are you sure you want to delete this job?')) {
      try {
        const jobRef = ref(this.db, `jobs/${jobId}`);
        await remove(jobRef);
        alert('Job deleted successfully!');
      } catch (error: any) {
        console.error('Error deleting job:', error);
        alert('Error deleting job: ' + error.message);
      }
    }
  }

  formatDate(dateValue: string | number): string {
    if (typeof dateValue === 'number') {
      return new Date(dateValue).toLocaleDateString();
    }
    return new Date(dateValue).toLocaleDateString();
  }

  // Modal functions
  openCreateJobModal() {
    this.showCreateModal = true;
    this.createJobForm.reset();
  }

  closeCreateJobModal() {
    this.showCreateModal = false;
    this.createJobForm.reset();
  }

  viewJob(job: any) {
    this.selectedJob = job;
    this.showViewModal = true;
  }

  closeViewJobModal() {
    this.showViewModal = false;
    this.selectedJob = null;
  }

  async onCreateJob() {
    if (this.createJobForm.valid) {
      this.isCreatingJob = true;
      
      try {
        const formData = this.createJobForm.value;
        const jobData = {
          jobTitle: formData.title,
          subtitle: formData.subtitle || '',
          company: formData.company,
          jobType: formData.jobType,
          applyLastDate: formData.lastDate,
          createdDate: formData.createdDate,
          qualifications: formData.content,
          email: this.currentUser?.email || 'Unknown',
          contact: this.currentUser?.email || 'Unknown',
          createdBy: this.currentUser?.email || 'Unknown',
          createdAt: Date.now()
        };

        const jobsRef = ref(this.db, 'jobs');
        await push(jobsRef, jobData);
        
        this.closeCreateJobModal();
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