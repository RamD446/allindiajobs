import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { ref, push, update, remove, onValue } from 'firebase/database';
import { auth, db } from '../../../config/firebase.config';
import { Job, DEFAULT_JOB_CATEGORIES, PRIVATE_JOB_TYPES, CompanyImage, getCategoryDisplayLabel } from '../../models/job.model';
import { TiptapEditorComponent } from '../shared/tiptap-editor/tiptap-editor.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TiptapEditorComponent],
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
  selectedFilterJobType: string = 'All';
  selectedFilterExperience: string = 'All';
  selectedFilterQualification: string = 'All';
  selectedFilterLocation: string = 'All';
  showJobForm: boolean = false;
  editingJob: Job | null = null;
  isSaving: boolean = false;
  expandedJobIds: Set<string> = new Set();
  showExportConfirmModal: boolean = false;
  showDeleteConfirmModal: boolean = false;
  pendingDeleteJobId: string | null = null;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  activeAdminTab: 'jobs' | 'companies' = 'jobs';
  showCompanyImageForm: boolean = false;
  showImportModal: boolean = false;
  importModalType: 'jobs' | 'companies' | null = null;
  selectedImportFileName: string = '';
  pendingImportRows: Record<string, any>[] = [];
  importModalError: string = '';
  isSavingCompanyImage: boolean = false;
  isImportingData: boolean = false;
  companyImages: CompanyImage[] = [];
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Job form
  jobForm: Job = {
    id: '',
    title: '',
    company: '',
    companyImage: '',
    jobLocation: '',
    jobType: 'Walk-ins',
    category: '',
    experience: 'Freshers',
    fullInformationTableFormat: '',
    fullJobInformation: '',
    walkInDrive: true,
    description: '',
    otherLink: '',
    walkInInterviewLocation: '',
    hrDetails: '',
    createdDate: ''
  };

  companyImageForm: CompanyImage = {
    id: '',
    companyName: '',
    companyImage: '',
    createdDate: ''
  };

  jobCategories: string[] = [];
  privateJobTypes: string[] = [...PRIVATE_JOB_TYPES];
  jobTypeOptions: string[] = ['Walk-ins', 'Non-Walkins'];
  experienceOptions: string[] = ['Freshers', 'Experienced'];
  locationOptions: string[] = ['Vishakhapatnam', 'Hyderabad', 'Bengaluru'];
  qualificationOptions: string[] = ['B.Tech', 'Degree', 'Any Graduate'];

  constructor(private cdr: ChangeDetectorRef, private router: Router) {
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

  getCategoryDisplayLabel(category: string): string {
    return getCategoryDisplayLabel(category);
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
        // Load admin data then set loading to false.
        this.loadJobs();
        this.loadCompanyImages();
      } else {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.jobs = [];
        this.companyImages = [];
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
      this.showCompanyImageForm = false;
      this.editingJob = null;
      this.jobs = [];
      this.companyImages = [];
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
          this.jobs = this.sortByLatestCreated(this.jobs);
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

  async loadCompanyImages() {
    try {
      const companyImagesRef = ref(db, 'companyImages');
      onValue(companyImagesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.companyImages = Object.keys(data)
            .map((key) => ({ id: key, ...data[key] }))
            .sort((a, b) => a.companyName.localeCompare(b.companyName)) as CompanyImage[];
        } else {
          this.companyImages = [];
        }
        this.cdr.detectChanges();
      }, (error) => {
        console.error('Error loading company images:', error);
      });
    } catch (error) {
      console.error('Error loading company images:', error);
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

  private getCreatedTimestamp(job: Job): number {
    const raw = (job.createdDate || '').toString().trim();
    if (!raw) {
      return 0;
    }

    // Support both ISO strings and datetime-local style values.
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

  getFilteredJobs(): Job[] {
    return this.jobs.filter((job) => {
      const categoryPass = this.selectedJobCategory === 'All' || job.category === this.selectedJobCategory;
      const jobTypePass = this.selectedFilterJobType === 'All' || (job.jobType || '') === this.selectedFilterJobType;
      const experiencePass = this.selectedFilterExperience === 'All' || (job.experience || '') === this.selectedFilterExperience;
      const qualificationPass = this.selectedFilterQualification === 'All' || (job.qualification || '') === this.selectedFilterQualification;
      const locationSource = ((job as any).location || job.jobLocation || '').toLowerCase();
      const locationPass = this.selectedFilterLocation === 'All'
        || locationSource.includes(this.selectedFilterLocation.toLowerCase());

      return categoryPass && jobTypePass && experiencePass && qualificationPass && locationPass;
    });
  }

  getSortedFilteredJobs(): Job[] {
    return this.sortByLatestCreated(this.getFilteredJobs());
  }

  getCategoryCount(category: string): number {
    if (category === 'All') return this.jobs.length;
    return this.jobs.filter(job => job.category === category).length;
  }

  selectCategoryTab(category: string) {
    this.selectedJobCategory = category;
    this.selectedFilterJobType = 'All';
    this.selectedFilterExperience = 'All';
    this.selectedFilterQualification = 'All';
    this.selectedFilterLocation = 'All';
  }

  getJobTypeFilterOptions(): string[] {
    return this.getUniqueFilterOptions(this.jobs.map((job) => job.jobType), this.jobTypeOptions);
  }

  getExperienceFilterOptions(): string[] {
    return this.getUniqueFilterOptions(this.jobs.map((job) => job.experience), this.experienceOptions);
  }

  getQualificationFilterOptions(): string[] {
    return this.getUniqueFilterOptions(this.jobs.map((job) => job.qualification), this.qualificationOptions);
  }

  getLocationFilterOptions(): string[] {
    const jobLocations = this.jobs
      .map((job) => (job as any).location || '')
      .filter((value) => !!value && value.toString().trim().length > 0)
      .map((value) => value.toString().trim());

    return this.getUniqueFilterOptions(jobLocations, this.locationOptions);
  }

  onIndependentFilterChange(changedFilter: 'jobType' | 'experience' | 'qualification' | 'location') {
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
      return;
    }

    if (changedFilter === 'experience') {
      this.selectedFilterExperience = value;
      return;
    }

    if (changedFilter === 'qualification') {
      this.selectedFilterQualification = value;
      return;
    }

    this.selectedFilterLocation = value;
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

  showCreateForm() {
    this.activeAdminTab = 'jobs';
    this.showJobForm = true;
    this.editingJob = null;
    this.resetJobForm();
  }

  showCreateCompanyImageForm() {
    this.activeAdminTab = 'companies';
    this.showCompanyImageForm = true;
    this.resetCompanyImageForm();
  }

  openImportModal(type: 'jobs' | 'companies') {
    this.importModalType = type;
    this.showImportModal = true;
    this.selectedImportFileName = '';
    this.pendingImportRows = [];
    this.importModalError = '';
  }

  closeImportModal() {
    this.showImportModal = false;
    this.importModalType = null;
    this.selectedImportFileName = '';
    this.pendingImportRows = [];
    this.importModalError = '';
    this.isImportingData = false;
  }

  switchAdminTab(tab: 'jobs' | 'companies') {
    this.activeAdminTab = tab;
  }

  editJob(job: Job) {
    this.showJobForm = true;
    this.editingJob = job;
    
    this.jobForm = { 
      ...job,
      companyImage: this.keepOnlyImageEmbeds(job.companyImage || '') || this.getCompanyImageByName(job.company),
      jobLocation: job.jobLocation || '',
      jobType: job.jobType || (job.walkInDrive ? 'Walk-ins' : 'Non-Walkins'),
      experience: job.experience || 'Freshers',
      qualification: job.qualification || 'Any Graduate',
      fullInformationTableFormat: job.fullInformationTableFormat || '',
      fullJobInformation: job.fullJobInformation || '',
      walkInDrive: job.jobType ? job.jobType === 'Walk-ins' : !!job.walkInDrive,
      otherLink: job.otherLink || '',
      walkInInterviewLocation: '',
      hrDetails: '',
      createdDate: job.createdDate || ''
    };
  }

  requestDeleteConfirmation(jobId: string) {
    this.pendingDeleteJobId = jobId;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal() {
    this.showDeleteConfirmModal = false;
    this.pendingDeleteJobId = null;
  }

  async confirmDeleteJob() {
    const jobId = this.pendingDeleteJobId;
    if (!jobId) {
      this.closeDeleteConfirmModal();
      return;
    }

    this.closeDeleteConfirmModal();
    await this.deleteJob(jobId);
  }

  async deleteJob(jobId: string) {
    try {
      const jobRef = ref(db, `jobs/${jobId}`);
      await remove(jobRef);
      console.log('Job deleted successfully');
      this.showSuccessToast('Job deleted successfully.');
    } catch (error) {
      console.error('Error deleting job:', error);
      this.showErrorToast('Failed to delete job. Please try again.');
    }
  }

  async deleteJobsByCategory(category: string) {
    const jobsToDelete = this.jobs.filter(job => job.category === category);
    
    if (jobsToDelete.length === 0) {
      this.showErrorToast(`No jobs found in ${category} category.`);
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
        this.showSuccessToast(`Deleted ${jobsToDelete.length} jobs from ${category} category.`);
        console.log(`Deleted ${jobsToDelete.length} jobs from ${category}`);
      } catch (error) {
        console.error('Error deleting jobs by category:', error);
        this.showErrorToast('Failed to delete some jobs. Please try again.');
      }
    }
  }

  async saveJob() {
    // Prevent double submission
    if (this.isSaving) return;
    const isUpdateFlow = !!this.editingJob;
    
    try {
      this.isSaving = true;
      this.cdr.detectChanges();
      
      if (this.editingJob) {
        // Update existing job
        const jobRef = ref(db, `jobs/${this.editingJob.id}`);
        const { id, ...jobData } = this.jobForm;
        const normalizedCurrentImage = this.keepOnlyImageEmbeds(jobData.companyImage || '');
        const normalizedMappedImage = this.keepOnlyImageEmbeds(this.getCompanyImageByName(jobData.company) || '');
        const normalizedJobData = {
          ...jobData,
          companyImage: normalizedCurrentImage || normalizedMappedImage,
          fullInformationTableFormat: jobData.fullInformationTableFormat || '',
          fullJobInformation: jobData.fullJobInformation || '',
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
        const normalizedCurrentImage = this.keepOnlyImageEmbeds(jobData.companyImage || '');
        const normalizedMappedImage = this.keepOnlyImageEmbeds(this.getCompanyImageByName(jobData.company) || '');
        const normalizedJobData = {
          ...jobData,
          companyImage: normalizedCurrentImage || normalizedMappedImage,
          fullInformationTableFormat: jobData.fullInformationTableFormat || '',
          fullJobInformation: jobData.fullJobInformation || '',
          walkInDrive: jobData.jobType === 'Walk-ins',
          walkInInterviewLocation: '',
          hrDetails: ''
        };
        const newJobData = {
          ...normalizedJobData,
          createdDate: new Date().toISOString()
        };
        await push(jobsRef, newJobData);
        console.log('Job created successfully');
      }
      
      // Reset saving state before closing modal
      this.isSaving = false;
      this.cdr.detectChanges();

      // Close modal and reset form after successful create/update.
      this.cancelJobForm();

      if (isUpdateFlow) {
        this.showSuccessToast('Job updated successfully.');
      } else {
        this.showSuccessToast('Job created successfully.');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      this.showErrorToast('Failed to save job. Please try again.');
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

  cancelCompanyImageForm() {
    this.showCompanyImageForm = false;
    this.isSavingCompanyImage = false;
    this.resetCompanyImageForm();
  }

  resetJobForm() {
    this.jobForm = {
      id: '',
      title: '',
      company: '',
      companyImage: '',
      jobType: this.jobTypeOptions[0],
      category: this.jobCategories.length > 0 ? this.jobCategories[0] : '',
      experience: this.experienceOptions[0],
      qualification: this.qualificationOptions[2],
      fullInformationTableFormat: '',
      fullJobInformation: '',
      walkInDrive: true,
      description: '',
      jobLocation: this.locationOptions[0],
      otherLink: '',
      walkInInterviewLocation: '',
      hrDetails: '',
      createdDate: ''
    };
  }

  resetCompanyImageForm() {
    this.companyImageForm = {
      id: '',
      companyName: '',
      companyImage: '',
      createdDate: ''
    };
  }

  onJobTypeChange() {
    this.jobForm.walkInDrive = this.jobForm.jobType === 'Walk-ins';
  }

  onCompanySelectionChange() {
    const mappedImage = this.getCompanyImageByName(this.jobForm.company);
    this.jobForm.companyImage = mappedImage;
  }

  async saveCompanyImage() {
    const companyName = this.companyImageForm.companyName.trim();
    const normalizedImageHtml = this.normalizeImageHtml(this.companyImageForm.companyImage || '');
    const editingId = this.companyImageForm.id;

    if (!companyName || !normalizedImageHtml) {
      this.showErrorToast('Company name and company image are required.');
      return;
    }

    if (this.isSavingCompanyImage) {
      return;
    }

    try {
      this.isSavingCompanyImage = true;
      this.cdr.detectChanges();

      const existingById = editingId
        ? this.companyImages.find((item) => item.id === editingId)
        : null;

      const existingByName = this.companyImages.find(
        (item) => this.normalizeCompanyName(item.companyName) === this.normalizeCompanyName(companyName)
      );

      const payload = {
        companyName,
        companyImage: normalizedImageHtml,
        updatedDate: new Date().toISOString()
      };

      const targetId = existingById?.id || existingByName?.id;

      if (targetId) {
        const updateRef = ref(db, `companyImages/${targetId}`);
        await update(updateRef, payload);
      } else {
        const createRef = ref(db, 'companyImages');
        await push(createRef, {
          ...payload,
          createdDate: new Date().toISOString()
        });
      }

      if (this.jobForm.company && this.normalizeCompanyName(this.jobForm.company) === this.normalizeCompanyName(companyName)) {
        this.jobForm.companyImage = normalizedImageHtml;
      }

      this.showSuccessToast('Company image saved successfully.');
      this.cancelCompanyImageForm();
    } catch (error) {
      console.error('Error saving company image:', error);
      this.showErrorToast('Failed to save company image. Please try again.');
      this.isSavingCompanyImage = false;
      this.cdr.detectChanges();
    }
  }

  editCompanyImage(item: CompanyImage) {
    this.activeAdminTab = 'companies';
    this.showCompanyImageForm = true;
    this.companyImageForm = {
      id: item.id,
      companyName: item.companyName,
      companyImage: item.companyImage,
      createdDate: item.createdDate
    };
  }

  async deleteCompanyImage(item: CompanyImage) {
    const isConfirmed = confirm(`Delete company image for "${item.companyName}"?`);
    if (!isConfirmed) {
      return;
    }

    try {
      const companyRef = ref(db, `companyImages/${item.id}`);
      await remove(companyRef);
      this.showSuccessToast('Company image deleted successfully.');
    } catch (error) {
      console.error('Error deleting company image:', error);
      this.showErrorToast('Failed to delete company image. Please try again.');
    }
  }

  getCompanyImagePreview(html: string): string | null {
    if (!html) {
      return null;
    }

    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match && match[1] ? match[1] : null;
  }

  getCompanyUsageCount(companyName: string): number {
    if (!companyName) {
      return 0;
    }

    return this.jobs.filter((job) => job.company?.toLowerCase() === companyName.toLowerCase()).length;
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

  getCompanyImageByName(companyName: string): string {
    const key = this.normalizeCompanyName(companyName);
    if (!key) {
      return '';
    }

    const direct = this.companyImages.find(
      (item) => this.normalizeCompanyName(item.companyName) === key
    );

    if (direct?.companyImage) {
      return direct.companyImage;
    }

    const partial = this.companyImages.find((item) => {
      const itemKey = this.normalizeCompanyName(item.companyName);
      return key.includes(itemKey) || itemKey.includes(key);
    });

    return partial?.companyImage || '';
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

  viewJobDetails(job: Job) {
    const titleSlug = this.createSlug(job.title);
    this.router.navigate(['/job', job.id, titleSlug], { state: { job } });
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  requestExportConfirmation() {
    this.showExportConfirmModal = true;
  }

  closeExportConfirmModal() {
    this.showExportConfirmModal = false;
  }

  confirmExportDownload() {
    this.closeExportConfirmModal();
    this.exportJobsToExcel();
  }

  exportJobsToExcel() {
    try {
      const headers = [
        'JobTitle',
        'CompanyName',
        'CompanyImageHtml',
        'JobType',
        'Category',
        'Experience',
        'Qualification',
        'JobLocationAndHRDetails',
        'JobDescription',
        'ApplyOfficialLink',
        'FullInformationImagesHtml',
        'FullJobInformationHtml',
        'CreatedDate'
      ];

      const rows = this.jobs.map((job) => ({
        JobTitle: job.title || '',
        CompanyName: job.company || '',
        CompanyImageHtml: job.companyImage || '',
        JobType: job.jobType || 'Walk-ins',
        Category: job.category || '',
        Experience: job.experience || 'Freshers',
        Qualification: job.qualification || 'Any Graduate',
        JobLocationAndHRDetails: job.jobLocation || '',
        JobDescription: job.description || '',
        ApplyOfficialLink: job.otherLink || '',
        FullInformationImagesHtml: job.fullInformationTableFormat || '',
        FullJobInformationHtml: job.fullJobInformation || '',
        CreatedDate: job.createdDate || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Jobs');

      const dateTag = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `alljobs-${dateTag}.xls`, { bookType: 'biff8', compression: true });
      this.showSuccessToast('XLS file downloaded successfully.');
    } catch (error) {
      console.error('Excel export failed:', error);
      this.showErrorToast('Unable to download XLS file. Please try again.');
    }
  }

  exportCompaniesToExcel() {
    try {
      const headers = [
        'CompanyName',
        'CompanyImageHtml',
        'CreatedDate',
        'UpdatedDate'
      ];

      const rows = this.companyImages.map((item) => ({
        CompanyName: item.companyName || '',
        CompanyImageHtml: item.companyImage || '',
        CreatedDate: item.createdDate || '',
        UpdatedDate: item.updatedDate || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');

      const dateTag = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `companies-${dateTag}.xls`, { bookType: 'biff8', compression: true });
      this.showSuccessToast('Company XLS file downloaded successfully.');
    } catch (error) {
      console.error('Company export failed:', error);
      this.showErrorToast('Unable to download company XLS file. Please try again.');
    }
  }

  async onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }

    this.importModalError = '';

    if (!file.name.toLowerCase().endsWith('.xls')) {
      this.importModalError = 'Only .xls files are supported.';
      this.selectedImportFileName = '';
      this.pendingImportRows = [];
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

      if (!rawRows.length) {
        this.importModalError = 'XLS file is empty.';
        this.selectedImportFileName = '';
        this.pendingImportRows = [];
        return;
      }

      this.selectedImportFileName = file.name;
      this.pendingImportRows = rawRows;
      this.importModalError = '';
    } catch (error) {
      console.error('Excel preview failed:', error);
      this.importModalError = 'Failed to read the XLS file. Please check the format.';
      this.selectedImportFileName = '';
      this.pendingImportRows = [];
    } finally {
      input.value = '';
      this.cdr.detectChanges();
    }
  }

  async saveImportedData() {
    if (!this.importModalType || this.pendingImportRows.length === 0 || this.isImportingData) {
      return;
    }

    try {
      this.isImportingData = true;
      this.importModalError = '';
      this.cdr.detectChanges();

      if (this.importModalType === 'jobs') {
        await this.importJobsFromRows(this.pendingImportRows);
      } else {
        await this.importCompaniesFromRows(this.pendingImportRows);
      }

      const importedLabel = this.importModalType === 'jobs' ? 'Jobs' : 'Companies';
      this.closeImportModal();
      this.showSuccessToast(`${importedLabel} imported successfully.`);
    } catch (error) {
      console.error('Import failed:', error);
      this.importModalError = 'Failed to import data. Please verify the XLS columns and try again.';
      this.showErrorToast(this.importModalError);
    } finally {
      this.isImportingData = false;
      this.cdr.detectChanges();
    }
  }

  downloadImportTemplate() {
    if (this.importModalType === 'companies') {
      this.downloadCompanyTemplateXls();
      return;
    }

    this.downloadJobsTemplateXls();
  }

  private downloadJobsTemplateXls() {
    const headers = [
      'JobTitle',
      'CompanyName',
      'CompanyImageHtml',
      'JobType',
      'Category',
      'Experience',
      'Qualification',
      'JobLocationAndHRDetails',
      'JobDescription',
      'ApplyOfficialLink',
      'FullInformationImagesHtml',
      'FullJobInformationHtml',
      'CreatedDate'
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jobs');
    XLSX.writeFile(workbook, 'jobs-import-template.xls', { bookType: 'biff8', compression: true });
  }

  private downloadCompanyTemplateXls() {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['CompanyName', 'CompanyImageHtml', 'CreatedDate']
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');
    XLSX.writeFile(workbook, 'companies-import-template.xls', { bookType: 'biff8', compression: true });
  }

  private async importJobsFromRows(rawRows: Record<string, any>[]) {
    const jobsRef = ref(db, 'jobs');
    let imported = 0;
    let skipped = 0;

    for (const row of rawRows) {
      const title = this.getExcelValue(row, ['JobTitle', 'Job Title', 'Title']).trim();
      const company = this.getExcelValue(row, ['CompanyName', 'Company Name', 'Company']).trim();
      const category = this.getExcelValue(row, ['Category']).trim();

      if (!title || !company || !category) {
        skipped++;
        continue;
      }

      const jobType = this.getExcelValue(row, ['JobType', 'Job Type']) || 'Walk-ins';
      const createdDate = this.getExcelValue(row, ['CreatedDate', 'Created Date']) || new Date().toISOString();

      const newJobData = {
        title,
        company,
        companyImage: this.normalizeImageHtml(this.getExcelValue(row, ['CompanyImageHtml', 'Company Image Html', 'CompanyImage']) || ''),
        jobType,
        category,
        experience: this.getExcelValue(row, ['Experience']) || 'Freshers',
        qualification: this.getExcelValue(row, ['Qualification', 'EducationalQualification', 'Qualification Required']) || 'Any Graduate',
        jobLocation: this.getExcelValue(row, ['JobLocationAndHRDetails', 'Job Location and HR Details', 'JobLocation']) || '',
        description: this.getExcelValue(row, ['JobDescription', 'Job Description']) || '',
        otherLink: this.getExcelValue(row, ['ApplyOfficialLink', 'Apply Official Link']) || '',
        fullInformationTableFormat: this.getExcelValue(row, ['FullInformationImagesHtml', 'Full Information Images Html', 'FullInformationTableFormat']) || '',
        fullJobInformation: this.getExcelValue(row, ['FullJobInformationHtml', 'Full Job Information Html', 'FullJobInformation']) || '',
        walkInDrive: jobType === 'Walk-ins',
        walkInInterviewLocation: '',
        hrDetails: '',
        createdDate
      };

      await push(jobsRef, newJobData);
      imported++;
    }

    this.showSuccessToast(`Import complete. Imported: ${imported}, Skipped: ${skipped}.`);
  }

  private async importCompaniesFromRows(rawRows: Record<string, any>[]) {
    const companyImagesRef = ref(db, 'companyImages');
    let imported = 0;
    let skipped = 0;

    for (const row of rawRows) {
      const companyName = this.getExcelValue(row, ['CompanyName', 'Company Name']).trim();
      const imageValue = this.getExcelValue(row, ['CompanyImageHtml', 'Company Image Html', 'CompanyImage', 'CompanyImageUrl', 'Company Image Url']).trim();
      const createdDate = this.getExcelValue(row, ['CreatedDate', 'Created Date']) || new Date().toISOString();

      if (!companyName || !imageValue) {
        skipped++;
        continue;
      }

      await push(companyImagesRef, {
        companyName,
        companyImage: this.normalizeImageHtml(imageValue),
        createdDate
      });
      imported++;
    }

    this.showSuccessToast(`Import complete. Imported: ${imported}, Skipped: ${skipped}.`);
  }

  private showSuccessToast(message: string) {
    this.showToastMessage(message, 'success');
  }

  private showErrorToast(message: string) {
    this.showToastMessage(message, 'error');
  }

  private showToastMessage(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.toastTimer = null;
      this.cdr.detectChanges();
    }, 2800);

    this.cdr.detectChanges();
  }

  private getExcelValue(row: Record<string, any>, keys: string[]): string {
    const map = new Map<string, any>();
    Object.keys(row).forEach((k) => {
      const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      map.set(normalizedKey, row[k]);
    });

    for (const key of keys) {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (map.has(normalized)) {
        return String(map.get(normalized) ?? '');
      }
    }

    return '';
  }

  private normalizeImageHtml(value: string): string {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      return '';
    }

    const embeddedImages = this.keepOnlyImageEmbeds(trimmed);
    if (embeddedImages) {
      return embeddedImages;
    }

    if (/^(https?:\/\/|data:image\/)/i.test(trimmed)) {
      return `<p><img src="${trimmed}" alt="Company image"></p>`;
    }

    return '';
  }
}

