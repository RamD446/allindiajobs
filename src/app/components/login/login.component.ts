import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { ref, push, update, remove, onValue } from 'firebase/database';
import { auth, db } from '../../../config/firebase.config';
import { Job, DEFAULT_JOB_CATEGORIES, PRIVATE_JOB_TYPES } from '../../models/job.model';
import { QuillModule } from 'ngx-quill';

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
  selectedJobCategory: string = 'All';
  showJobForm: boolean = false;
  editingJob: Job | null = null;
  isSaving: boolean = false;
  expandedJobIds: Set<string> = new Set();

  // Job form
  jobForm: Job = {
    id: '',
    title: '',
    company: '',
    jobLocation: '',
    jobType: 'Walk-ins',
    category: '',
    experience: 'Freshers',
    fullInformationTableFormat: '',
    walkInDrive: true,
    description: '',
    howToApply: '',
    keyResponsibilities: '',
    documentsRequired: '',
    eligibilityCriteria: '',
    otherLink: '',
    walkInInterviewLocation: '',
    hrDetails: '',
    createdDate: ''
  };

  jobCategories: string[] = [];
  privateJobTypes: string[] = [...PRIVATE_JOB_TYPES];
  jobTypeOptions: string[] = ['Walk-ins', 'Non-Walkins'];
  experienceOptions: string[] = ['Freshers', 'Experienced'];

  fullInfoEditorModules = {
    toolbar: {
      container: [
        ['image']
      ],
      handlers: {
        image: () => this.handleImageInsert('fullInfo')
      }
    }
  };

  private fullInfoQuillInstance: any;

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
        // Load jobs then set loading to false
        this.loadJobs();
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

  getFilteredJobs(): Job[] {
    if (this.selectedJobCategory === 'All') {
      return this.jobs;
    }
    return this.jobs.filter(job => job.category === this.selectedJobCategory);
  }

  getCategoryCount(category: string): number {
    if (category === 'All') return this.jobs.length;
    return this.jobs.filter(job => job.category === category).length;
  }

  showCreateForm() {
    this.showJobForm = true;
    this.editingJob = null;
    this.resetJobForm();
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
      jobLocation: job.jobLocation || '',
      jobType: job.jobType || (job.walkInDrive ? 'Walk-ins' : 'Non-Walkins'),
      experience: job.experience || 'Freshers',
      fullInformationTableFormat: job.fullInformationTableFormat || '',
      walkInDrive: job.jobType ? job.jobType === 'Walk-ins' : !!job.walkInDrive,
      howToApply: job.howToApply || '',
      keyResponsibilities: job.keyResponsibilities || '',
      documentsRequired: job.documentsRequired || '',
      eligibilityCriteria: job.eligibilityCriteria || '',
      otherLink: job.otherLink || '',
      walkInInterviewLocation: '',
      hrDetails: '',
      createdDate: formattedDate || this.toLocalIsoString(new Date())
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

  async deleteJobsByCategory(category: string) {
    const jobsToDelete = this.jobs.filter(job => job.category === category);
    
    if (jobsToDelete.length === 0) {
      alert(`No jobs found in ${category} category.`);
      return;
    }

    const confirmMessage = `Are you sure you want to delete ALL ${jobsToDelete.length} jobs in "${category}" category?\n\nThis action cannot be undone!`;
    
    if (confirm(confirmMessage)) {
      try {
        const deletePromises = jobsToDelete.map(job => {
          const jobRef = ref(db, `jobs/${job.id}`);
          return remove(jobRef);
        });
        
        await Promise.all(deletePromises);
        alert(`Successfully deleted ${jobsToDelete.length} jobs from ${category} category.`);
        console.log(`Deleted ${jobsToDelete.length} jobs from ${category}`);
      } catch (error) {
        console.error('Error deleting jobs by category:', error);
        alert('Failed to delete some jobs. Please try again.');
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
        const normalizedJobData = {
          ...jobData,
          fullInformationTableFormat: this.keepOnlyImageEmbeds(jobData.fullInformationTableFormat || ''),
          walkInDrive: jobData.jobType === 'Walk-ins',
          walkInInterviewLocation: '',
          hrDetails: ''
        };
        
        // Add or update updatedDate
        const updatedJobData = {
          ...normalizedJobData,
          updatedDate: new Date().toISOString()
        };
        
        await update(jobRef, updatedJobData);
        console.log('Job updated successfully');
      } else {
        // Create new job
        const jobsRef = ref(db, 'jobs');
        const { id, ...jobData } = this.jobForm;
        const normalizedJobData = {
          ...jobData,
          fullInformationTableFormat: this.keepOnlyImageEmbeds(jobData.fullInformationTableFormat || ''),
          walkInDrive: jobData.jobType === 'Walk-ins',
          walkInInterviewLocation: '',
          hrDetails: ''
        };
        const newJobData = {
          ...normalizedJobData,
          createdDate: jobData.createdDate || new Date().toISOString()
        };
        await push(jobsRef, newJobData);
        console.log('Job created successfully');
      }
      
      // Reset saving state before closing modal
      this.isSaving = false;
      this.cdr.detectChanges();
      
      // If it's a new job, reset form and keep modal open as requested
      if (!this.editingJob) {
        this.resetJobForm();
        alert('Job created successfully! You can add another one.');
      } else {
        // Close modal after successful edit
        this.cancelJobForm();
      }
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
      jobType: this.jobTypeOptions[0],
      category: this.jobCategories.length > 0 ? this.jobCategories[0] : '',
      experience: this.experienceOptions[0],
      fullInformationTableFormat: '',
      walkInDrive: true,
      description: '',
      jobLocation: '',
      howToApply: '',
      keyResponsibilities: '',
      documentsRequired: '',
      eligibilityCriteria: '',
      otherLink: '',
      walkInInterviewLocation: '',
      hrDetails: '',
      createdDate: this.toLocalIsoString(new Date())
    };
  }

  onJobTypeChange() {
    this.jobForm.walkInDrive = this.jobForm.jobType === 'Walk-ins';
  }
  
  onFullInfoEditorCreated(editor: any) {
    this.fullInfoQuillInstance = editor;
  }

  private async handleImageInsert(editorKey: 'fullInfo') {
    const file = await this.selectImageFile();
    if (!file) {
      return;
    }

    try {
      const dataUrl = await this.compressImageForEditor(file);
      const editor = editorKey === 'fullInfo' ? this.fullInfoQuillInstance : null;
      if (!editor) {
        return;
      }

      const range = editor.getSelection(true);
      const index = range ? range.index : editor.getLength();
      editor.insertEmbed(index, 'image', dataUrl, 'user');
      editor.setSelection(index + 1, 0);
    } catch (error) {
      console.error('Image processing failed:', error);
      alert('Unable to process this image. Please try another image.');
    }
  }

  private selectImageFile(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => resolve(input.files && input.files.length > 0 ? input.files[0] : null);
      input.click();
    });
  }

  private async compressImageForEditor(file: File): Promise<string> {
    const image = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas context not available');
    }

    // Force final image to 16:9 for consistent content layout.
    canvas.width = 1280;
    canvas.height = 720;

    const sourceAspect = image.width / image.height;
    const targetAspect = 16 / 9;

    let sx = 0;
    let sy = 0;
    let sw = image.width;
    let sh = image.height;

    if (sourceAspect > targetAspect) {
      sw = image.height * targetAspect;
      sx = (image.width - sw) / 2;
    } else if (sourceAspect < targetAspect) {
      sh = image.width / targetAspect;
      sy = (image.height - sh) / 2;
    }

    context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const minKb = 10;
    const maxKb = 20;
    let quality = 0.9;
    let bestDataUrl = canvas.toDataURL('image/jpeg', quality);
    let bestSizeKb = this.getDataUrlSizeKb(bestDataUrl);

    while (quality >= 0.2) {
      const candidate = canvas.toDataURL('image/jpeg', quality);
      const sizeKb = this.getDataUrlSizeKb(candidate);

      bestDataUrl = candidate;
      bestSizeKb = sizeKb;

      if (sizeKb <= maxKb) {
        break;
      }

      quality -= 0.05;
    }

    if (bestSizeKb < minKb) {
      bestDataUrl = canvas.toDataURL('image/jpeg', 0.98);
    }

    return bestDataUrl;
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getDataUrlSizeKb(dataUrl: string): number {
    const payload = dataUrl.split(',')[1] || '';
    const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
    const bytes = (payload.length * 3) / 4 - padding;
    return bytes / 1024;
  }

  private keepOnlyImageEmbeds(html: string): string {
    if (!html) {
      return '';
    }

    const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    if (matches.length === 0) {
      return '';
    }

    return matches
      .map((match) => `<p><img src="${match[1]}" alt="Job image"></p>`)
      .join('');
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

