import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { ref, push, get, update, remove, onValue } from 'firebase/database';
import { auth, db } from '../../../config/firebase.config';
import { Job, DEFAULT_JOB_CATEGORIES } from '../../models/job.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
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
  expandedJobIds: Set<string> = new Set();
  
  // Visitor Tracking
  visitorStats: any = {
    daily: 0,
    monthly: 0,
    total: 0,
    apiCalls: 0,
    jobClicks: 0
  };

  // Quill editor configuration
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  // Job form
  jobForm: Job = {
    id: '',
    title: '',
    company: '',
    category: '',
    description: '',
    contactInfo: '',
    createdDate: new Date().toISOString()
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
    console.log('Login Component Initialized');
    // Check authentication state on component initialization
    this.isLoading = true;
    
    // Firebase Auth state persistence
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.isLoggedIn = true;
        this.currentUser = user;
        this.loginError = '';
        console.log('User is logged in:', user.email);
        // Load jobs and stats only then set loading to false
        this.loadJobs();
        this.loadVisitorStats();
      } else {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.jobs = [];
        this.isLoading = false;
        console.log('User is logged out');
        this.cdr.detectChanges();
      }
    });
  }

  private loadVisitorStats() {
    const now = new Date();
    const day = now.toISOString().split('T')[0];
    const month = day.substring(0, 7);

    const statsRef = ref(db, 'stats');
    onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.visitorStats = {
          daily: data.daily?.[day] || 0,
          monthly: data.monthly?.[month] || 0,
          total: data.total || 0,
          apiCalls: data.apiCalls || 0,
          jobClicks: data.jobClicks || 0
        };
        this.cdr.detectChanges();
      }
    });
  }

  // Firebase Authentication Methods
  async onLogin() {
    try {
      this.isLoading = true;
      this.loginError = '';
      
      // Ensure persistence is set before login
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
      this.isLoggedIn = true;
      this.currentUser = userCredential.user;
      console.log('Login successful:', userCredential.user.email);
      // Jobs will be loaded by onAuthStateChanged callback
    } catch (error: any) {
      this.loginError = error.message;
      console.error('Login error:', error);
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
          // Sort jobs by creation date - newest first
          this.jobs.sort((a, b) => {
            const dateA = new Date(a.createdDate || '1970-01-01').getTime();
            const dateB = new Date(b.createdDate || '1970-01-01').getTime();
            return dateB - dateA; // Descending order (newest first)
          });
        } else {
          this.jobs = [];
        }
        // Set loading to false after jobs are loaded
        this.isLoading = false;
        this.cdr.detectChanges();
      }, (error) => {
        console.error('Error loading jobs:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error loading jobs:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  toggleJobExpand(jobId: string) {
    if (this.expandedJobIds.has(jobId)) {
      this.expandedJobIds.delete(jobId);
    } else {
      this.expandedJobIds.add(jobId);
    }
  }

  isJobExpanded(jobId: string): boolean {
    return this.expandedJobIds.has(jobId);
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
      this.cdr.detectChanges();
      
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
          createdDate: new Date().toISOString()
        };
        await push(jobsRef, newJobData);
        console.log('Job created successfully');
      }
      
      // Reset saving state before closing modal
      this.isSaving = false;
      this.cdr.detectChanges();
      
      // Close modal after successful save
      this.cancelJobForm();
    } catch (error) {
      console.error('Error saving job:', error);
      this.isSaving = false;
      this.cdr.detectChanges();
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
      createdDate: new Date().toISOString()
    };
  }

  shareJobOnWhatsApp(job: Job) {
    // Strip HTML tags for WhatsApp message
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = job.description;
    const plainDescription = tempDiv.textContent || tempDiv.innerText || '';
    
    // Truncate description if too long
    const maxDescLength = 200;
    const shortDesc = plainDescription.length > maxDescLength 
      ? plainDescription.substring(0, maxDescLength) + '...' 
      : plainDescription;
    
    // Create job detail URL (adjust domain as needed)
    const jobUrl = `${window.location.origin}/job/${job.id}/${this.createSlug(job.title)}`;
    
    // Create WhatsApp message
    const message = `
🔔 *New Job Alert!*

📌 *${job.title}*
🏢 *Company:* ${job.company}
📂 *Category:* ${job.category}
📞 *Contact:* ${job.contactInfo}

📝 *Description:*
${shortDesc}

🔗 *View Full Details:*
${jobUrl}

_Share this opportunity with your friends!_
    `.trim();
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp share link
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

