import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { ref, push, get, update, remove, onValue } from 'firebase/database';
import { auth, db } from '../../../config/firebase.config';
import { Job, DEFAULT_JOB_CATEGORIES, JobCareer, CAREER_JOB_TYPES } from '../../models/job.model';

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
  jobCareers: JobCareer[] = [];
  activeTab: 'jobs' | 'careers' = 'jobs';
  showJobForm: boolean = false;
  showCareerForm: boolean = false;
  editingJob: Job | null = null;
  editingCareer: JobCareer | null = null;
  isSaving: boolean = false;
  expandedJobIds: Set<string> = new Set();
  expandedCareerIds: Set<string> = new Set();

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
    createdDate: '', // Will be set in constructor or reset
    experience: 'Fresher',
    walkInStartDate: '',
    walkInEndDate: '',
    lastDateToApply: ''
  };

  jobCategories: string[] = [];
  careerJobTypes: string[] = [...CAREER_JOB_TYPES];
  experienceOptions: string[] = ['Fresher', 'Experience'];

  // Career form
  careerForm: JobCareer = {
    id: '',
    company: '',
    jobType: this.careerJobTypes[0],
    careerOfficeUrl: '',
    createdDate: new Date().toISOString().slice(0, 16)
  };

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
        // Load jobs and careers only then set loading to false
        this.loadJobs();
        this.loadJobCareers();
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

  private loadJobCareers() {
    try {
      const careersRef = ref(db, 'jobCareers');
      onValue(careersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.jobCareers = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          // Sort careers by creation date - newest first
          this.jobCareers.sort((a, b) => {
            const dateA = new Date(a.createdDate || '1970-01-01').getTime();
            const dateB = new Date(b.createdDate || '1970-01-01').getTime();
            return dateB - dateA;
          });
        } else {
          this.jobCareers = [];
        }
        this.cdr.detectChanges();
      }, (error) => {
        console.error('Error loading job careers:', error);
      });
    } catch (error) {
      console.error('Error loading job careers:', error);
    }
  }

  // Firebase Authentication Methods
  async onLogin() {
    try {
      this.isLoading = true;
      this.loginError = '';
      
      // Ensure persistence is set before login
      await setPersistence(auth, browserSessionPersistence);
      
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

  toggleCareerExpand(careerId: string) {
    if (this.expandedCareerIds.has(careerId)) {
      this.expandedCareerIds.delete(careerId);
    } else {
      this.expandedCareerIds.add(careerId);
    }
  }

  isCareerExpanded(careerId: string): boolean {
    return this.expandedCareerIds.has(careerId);
  }

  showCreateForm() {
    this.showJobForm = true;
    this.editingJob = null;
    this.resetJobForm();
  }

  showCareerCreateForm() {
    this.showCareerForm = true;
    this.editingCareer = null;
    this.resetCareerForm();
  }

  private toLocalIsoString(date: Date): string {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISODate = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISODate;
  }

  editJob(job: Job) {
    this.showJobForm = true;
    this.editingJob = job;
    
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm) using local time
    let formattedDate = '';
    if (job.createdDate) {
      formattedDate = this.toLocalIsoString(new Date(job.createdDate));
    }
    
    this.jobForm = { 
      ...job,
      createdDate: formattedDate || this.toLocalIsoString(new Date())
    };
  }

  editCareer(career: JobCareer) {
    this.showCareerForm = true;
    this.editingCareer = career;
    
    let formattedDate = '';
    if (career.createdDate) {
      const d = new Date(career.createdDate);
      formattedDate = d.toISOString().slice(0, 16);
    }
    
    this.careerForm = { 
      ...career,
      createdDate: formattedDate || new Date().toISOString().slice(0, 16)
    };
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

  async deleteCareer(careerId: string) {
    if (confirm('Are you sure you want to delete this career?')) {
      try {
        const careerRef = ref(db, `jobCareers/${careerId}`);
        await remove(careerRef);
        console.log('Career deleted successfully');
      } catch (error) {
        console.error('Error deleting career:', error);
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
          createdDate: jobData.createdDate || new Date().toISOString()
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

  async saveCareer() {
    if (this.isSaving) return;
    
    try {
      this.isSaving = true;
      this.cdr.detectChanges();
      
      if (this.editingCareer) {
        const careerRef = ref(db, `jobCareers/${this.editingCareer.id}`);
        const { id, ...careerData } = this.careerForm;
        await update(careerRef, careerData);
        console.log('Career updated successfully');
      } else {
        const careersRef = ref(db, 'jobCareers');
        const { id, ...careerData } = this.careerForm;
        const newCareerData = {
          ...careerData,
          createdDate: new Date().toISOString()
        };
        await push(careersRef, newCareerData);
        console.log('Career created successfully');
      }
      
      this.isSaving = false;
      this.cdr.detectChanges();
      this.cancelCareerForm();
    } catch (error) {
      console.error('Error saving career:', error);
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

  cancelCareerForm() {
    this.showCareerForm = false;
    this.editingCareer = null;
    this.isSaving = false;
    this.resetCareerForm();
  }

  resetJobForm() {
    this.jobForm = {
      id: '',
      title: '',
      company: '',
      category: this.jobCategories.length > 0 ? this.jobCategories[0] : '',
      description: '',
      createdDate: this.toLocalIsoString(new Date()),
      experience: this.experienceOptions[0],
      walkInStartDate: '',
      walkInEndDate: '',
      lastDateToApply: ''
    };
  }

  resetCareerForm() {
    this.careerForm = {
      id: '',
      company: '',
      jobType: this.careerJobTypes[0],
      careerOfficeUrl: '',
      createdDate: new Date().toISOString().slice(0, 16)
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

