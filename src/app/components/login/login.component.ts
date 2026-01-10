import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { ref, push, get, update, remove, onValue } from 'firebase/database';
import { auth, db } from '../../../config/firebase.config';
import { Job, DEFAULT_JOB_CATEGORIES } from '../../models/job.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  // Login form
  email: string = '';
  password: string = '';
  isLoggedIn: boolean = false;
  loginError: string = '';
  currentUser: any = null;
  isLoading: boolean = false;

  // Job management
  jobs: Job[] = [];
  showJobForm: boolean = false;
  editingJob: Job | null = null;
  isSaving: boolean = false;

  // Job form
  jobForm: Job = {
    id: '',
    title: '',
    company: '',
    category: '',
    description: '',
    contactInfo: '',
    createdDate: new Date().toISOString().split('T')[0]
  };

  jobCategories: string[] = [];

  constructor(private cdr: ChangeDetectorRef) {
    this.loadJobMetadata();
  }

  private loadJobMetadata() {
    // Load job categories from shared constants
    // This could be expanded to fetch from Firebase configuration in the future
    this.jobCategories = [...DEFAULT_JOB_CATEGORIES];
    
    // Future enhancement: fetch these from Firebase configuration:
    // const categoriesRef = ref(db, 'config/jobCategories');
    // onValue(categoriesRef, (snapshot) => {
    //   if (snapshot.val()) {
    //     this.jobCategories = snapshot.val();
    //   }
    // });
  }

  ngOnInit() {
    // Check authentication state on component initialization
    this.isLoading = true;
    
    // Firebase Auth state persistence
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.isLoggedIn = true;
        this.currentUser = user;
        this.loginError = '';
        this.loadJobs();
        console.log('User is logged in:', user.email);
      } else {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.jobs = [];
        console.log('User is logged out');
      }
      
      this.isLoading = false;
      this.cdr.detectChanges(); // Force change detection
    });
  }

  // Firebase Authentication Methods
  async onLogin() {
    try {
      this.isLoading = true;
      this.loginError = '';
      this.cdr.detectChanges();
      
      // Ensure persistence is set before login
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
      this.isLoggedIn = true;
      this.currentUser = userCredential.user;
      console.log('Login successful:', userCredential.user.email);
    } catch (error: any) {
      this.loginError = error.message;
      console.error('Login error:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async logout() {
    try {
      await signOut(auth);
      this.isLoggedIn = false;
      this.currentUser = null;
      this.email = '';
      this.password = '';
      this.loginError = '';
      this.isLoading = false;
      this.showJobForm = false;
      this.editingJob = null;
      this.jobs = [];
      this.cdr.detectChanges();
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  }

  // Firebase Realtime Database Methods
  async loadJobs() {
    try {
      const jobsRef = ref(db, 'jobs');
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.jobs = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
        } else {
          this.jobs = [];
        }
      });
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  }

  showCreateForm() {
    this.showJobForm = true;
    this.editingJob = null;
    this.resetJobForm();
  }

  editJob(job: Job) {
    this.showJobForm = true;
    this.editingJob = job;
    this.jobForm = { ...job };
  }

  async deleteJob(jobId: string) {
    if (confirm('Are you sure you want to delete this job?')) {
      try {
        const jobRef = ref(db, `jobs/${jobId}`);
        await remove(jobRef);
        console.log('Job deleted successfully');
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  }

  async saveJob() {
    // Prevent double submission
    if (this.isSaving) return;
    
    try {
      this.isSaving = true;
      if (this.editingJob) {
        // Update existing job
        const jobRef = ref(db, `jobs/${this.editingJob.id}`);
        const { id, ...jobData } = this.jobForm;
        await update(jobRef, jobData);
        console.log('Job updated successfully');
      } else {
        // Create new job
        const jobsRef = ref(db, 'jobs');
        const { id, ...jobData } = this.jobForm;
        const newJobData = {
          ...jobData,
          createdDate: new Date().toISOString().split('T')[0]
        };
        await push(jobsRef, newJobData);
        console.log('Job created successfully');
      }
      // Close modal immediately after successful save
      this.cancelJobForm();
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      this.isSaving = false;
    }
  }

  cancelJobForm() {
    this.showJobForm = false;
    this.editingJob = null;
    this.isSaving = false;
    this.resetJobForm();
  }

  resetJobForm() {
    this.jobForm = {
      id: '',
      title: '',
      company: '',
      category: this.jobCategories.length > 0 ? this.jobCategories[0] : '',
      description: '',
      contactInfo: '',
      createdDate: new Date().toISOString().split('T')[0]
    };
  }
}
