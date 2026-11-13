import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { browserSessionPersistence, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { onValue, push, ref, remove, set, update } from 'firebase/database';
import * as XLSX from 'xlsx';
import { auth, db } from '../../../config/firebase.config';
import { Job } from '../../models/job.model';

const GOVERNMENT_JOB_TYPES = ['Government Jobs', 'Results', 'Syllabus'];
const PRIVATE_JOB_TYPES = ['IT Jobs', 'Non-IT Jobs', 'Pharma Jobs', 'Sales Jobs', 'Pharmaceutical Jobs', 'Bank Jobs', 'Other'];
const JOB_TYPES = [...GOVERNMENT_JOB_TYPES, ...PRIVATE_JOB_TYPES];

const JOB_ICONS = [
  ['bi-briefcase-fill', 'Briefcase'], ['bi-building', 'Building'], ['bi-bank', 'Bank'], ['bi-laptop', 'Laptop'],
  ['bi-code-slash', 'Code'], ['bi-mortarboard-fill', 'Education'], ['bi-hospital', 'Hospital'], ['bi-heart-pulse-fill', 'Healthcare'],
  ['bi-truck', 'Transport'], ['bi-airplane-fill', 'Aviation'], ['bi-gear-fill', 'Engineering'], ['bi-tools', 'Tools'],
  ['bi-people-fill', 'People'], ['bi-shop', 'Retail'], ['bi-currency-rupee', 'Finance'], ['bi-graph-up-arrow', 'Growth'],
  ['bi-book-fill', 'Books'], ['bi-pc-display', 'Computer'], ['bi-telephone-fill', 'Telephone'], ['bi-globe', 'Global']
].map(([id, label]) => ({ id, label }));

function emptyDraft(): Job {
  return {
    id: '', title: '', company: '', companyImage: '', jobIcon: 'bi-briefcase-fill', sector: 'Government',
    privateJobType: 'Non-walk-in', jobType: 'Government Jobs', experience: '', fullInformationTableFormat: '',
    fullJobInformation: '', walkInDrive: false, walkInDate: '', lastDateToApply: '', description: '',
    otherLink: '', applyPdfLink: '', createdBy: '', createdDate: ''
  };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  user: User | null = null;
  authLoading = true;
  isLoading = false;
  email = '';
  password = '';
  loginError = '';
  jobs: Job[] = [];
  pendingDeleteJob: Job | null = null;
  deleting = false;
  search = '';
  filter = 'All job types';
  draft = emptyDraft();
  editingId: string | null = null;
  formOpen = false;
  saving = false;
  importing = false;
  notice = '';
  noticeType: 'success' | 'error' | 'info' = 'info';
  governmentJobTypes = GOVERNMENT_JOB_TYPES;
  privateJobTypes = PRIVATE_JOB_TYPES;
  privateHiringTypes = ['Walk-in', 'Non-walk-in'];
  jobTypes = JOB_TYPES;
  jobIcons = JOB_ICONS;
  private stopAuth: (() => void) | null = null;
  private stopJobs: (() => void) | null = null;
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.stopAuth = onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.authLoading = false;
      if (user) this.loadJobs();
      else {
        this.stopJobs?.();
        this.jobs = [];
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAuth?.();
    this.stopJobs?.();
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
  }

  get filteredJobs(): Job[] {
    const query = this.search.trim().toLowerCase();
    return this.jobs.filter((job) => {
      const matchesType = this.filter === 'All job types' || job.jobType === this.filter;
      return matchesType && (!query || `${job.title} ${job.company}`.toLowerCase().includes(query));
    });
  }

  async login(): Promise<void> {
    this.loginError = '';
    this.isLoading = true;
    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, this.email.trim(), this.password);
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
      if (['auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/user-not-found', 'auth/wrong-password'].includes(code)) this.loginError = 'Invalid email or password. Please try again.';
      else if (code === 'auth/invalid-email') this.loginError = 'Enter a valid email address.';
      else this.loginError = error instanceof Error ? error.message : 'Unable to sign in. Check your credentials.';
      this.isLoading = false;
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
    this.formOpen = false;
    this.editingId = null;
  }

  private loadJobs(): void {
    this.stopJobs?.();
    this.isLoading = true;
    this.stopJobs = onValue(ref(db, 'jobs'), (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<Job, 'id'>> | null;
      this.jobs = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : [];
      this.jobs.sort((first, second) => this.time(second.createdDate) - this.time(first.createdDate));
      this.isLoading = false;
      this.cdr.detectChanges();
    }, () => {
      this.notice = 'Could not load jobs. Check your database access rules.';
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  startCreate(): void {
    this.draft = emptyDraft();
    this.editingId = null;
    this.formOpen = true;
    this.dismissNotice();
  }

  startEdit(job: Job): void {
    const oldType = job.jobType || '';
    const sector = job.sector || (GOVERNMENT_JOB_TYPES.includes(oldType) ? 'Government' : 'Private');
    const jobType = sector === 'Government'
      ? GOVERNMENT_JOB_TYPES.includes(oldType) ? oldType : 'Government Jobs'
      : PRIVATE_JOB_TYPES.includes(oldType) ? oldType : 'IT Jobs';
    this.draft = {
      ...emptyDraft(), ...job, sector, jobType,
      companyImage: job.companyImage || '', jobIcon: job.jobIcon || 'bi-briefcase-fill',
      privateJobType: job.privateJobType || (job.walkInDrive || oldType === 'Walk-ins' ? 'Walk-in' : 'Non-walk-in'),
      experience: job.experience || '', walkInDrive: job.walkInDrive || oldType === 'Walk-ins'
    };
    this.editingId = job.id;
    this.formOpen = true;
    this.dismissNotice();
  }

  onSectorChange(): void {
    this.draft.jobType = this.draft.sector === 'Government' ? 'Government Jobs' : 'IT Jobs';
    this.draft.privateJobType = 'Non-walk-in';
    this.draft.walkInDate = '';
    this.draft.lastDateToApply = '';
    this.draft.walkInDrive = false;
  }

  onGovernmentTypeChange(): void {
    if (this.draft.jobType !== 'Government Jobs') this.draft.lastDateToApply = '';
  }

  onPrivateHiringChange(): void {
    this.draft.walkInDrive = this.draft.privateJobType === 'Walk-in';
    if (!this.draft.walkInDrive) this.draft.walkInDate = '';
  }

  isExperienceSelected(value: string): boolean {
    return (this.draft.experience || '').split(/[,|]/).map((item) => item.trim()).includes(value);
  }

  toggleExperience(value: string, checked: boolean): void {
    const values = (this.draft.experience || '').split(/[,|]/).map((item) => item.trim()).filter((item) => item && item !== value);
    if (checked) values.push(value);
    this.draft.experience = values.join(', ');
  }

  focusEditorControl(event: PointerEvent): void {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      target.focus({ preventScroll: true });
    }
  }

  closeForm(): void {
    if (this.saving) return;
    this.formOpen = false;
    this.editingId = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.pendingDeleteJob) this.cancelDelete();
    else this.closeForm();
  }

  async saveJob(): Promise<void> {
    if (this.saving) return;
    const wasEditing = Boolean(this.editingId);
    this.dismissNotice();
    const sector = this.draft.sector || 'Government';
    const privateJobType = this.draft.privateJobType || 'Non-walk-in';
    const record = {
      ...this.draft,
      sector,
      privateJobType,
      companyImage: (this.draft.companyImage || '').trim(),
      jobIcon: this.draft.jobIcon || 'bi-briefcase-fill',
      walkInDrive: sector === 'Private' && privateJobType === 'Walk-in',
      walkInDate: sector === 'Private' && privateJobType === 'Walk-in' ? this.draft.walkInDate || '' : '',
      lastDateToApply: sector === 'Government' && this.draft.jobType === 'Government Jobs' ? this.draft.lastDateToApply || '' : ''
    };
    const { id, ...data } = record;
    const jobRef = this.editingId ? ref(db, `jobs/${this.editingId}`) : push(ref(db, 'jobs'));
    const jobId = this.editingId || jobRef.key;
    if (!jobId) {
      this.showNotice('Unable to save this job. Please try again.', 'error');
      return;
    }

    const originalJob = this.jobs.find((job) => job.id === jobId) || null;
    const savedAt = new Date().toISOString();
    const createdDate = wasEditing ? data.createdDate || savedAt : savedAt;
    const optimisticJob: Job = {
      ...data,
      id: jobId,
      createdDate,
      ...(wasEditing ? { updatedDate: savedAt } : {})
    };

    if (wasEditing) this.jobs = this.jobs.map((job) => job.id === jobId ? optimisticJob : job);
    else this.jobs = [optimisticJob, ...this.jobs];
    this.jobs.sort((first, second) => this.time(second.createdDate) - this.time(first.createdDate));
    this.formOpen = false;
    this.editingId = null;
    this.draft = emptyDraft();
    this.saving = true;
    this.showNotice('Saving job...', 'info', false);
    this.cdr.detectChanges();

    try {
      if (wasEditing) await update(jobRef, { ...data, updatedDate: savedAt });
      else await set(jobRef, { ...data, createdDate: createdDate });
      this.showNotice(wasEditing ? 'Job updated.' : 'Job published.', 'success');
    } catch {
      if (originalJob) this.jobs = this.jobs.map((job) => job.id === jobId ? originalJob : job);
      else this.jobs = this.jobs.filter((job) => job.id !== jobId);
      this.showNotice('Unable to save. Check the Firebase database rules for this account.', 'error');
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  requestDelete(job: Job): void {
    this.pendingDeleteJob = job;
  }

  cancelDelete(): void {
    if (this.deleting) return;
    this.pendingDeleteJob = null;
  }

  async confirmDelete(): Promise<void> {
    const job = this.pendingDeleteJob;
    if (!job || this.deleting) return;
    const previousJobs = this.jobs;
    this.deleting = true;
    this.pendingDeleteJob = null;
    this.jobs = this.jobs.filter((item) => item.id !== job.id);
    this.showNotice('Deleting job...', 'info', false);
    try {
      await remove(ref(db, `jobs/${job.id}`));
      this.showNotice('Job deleted.', 'success');
    } catch {
      this.jobs = previousJobs;
      this.showNotice('Unable to delete this job. Check database permissions.', 'error');
    } finally {
      this.deleting = false;
      this.cdr.detectChanges();
    }
  }

  exportJobs(): void {
    const rows = this.jobs.map((job) => ({
      JobTitle: job.title || '', CompanyName: job.company || '', CompanyImageHtml: job.companyImage || '',
      JobIcon: job.jobIcon || 'bi-briefcase-fill', Sector: job.sector || '', PrivateJobType: job.privateJobType || '',
      JobType: job.jobType || '', Experience: job.experience || '', JobDescription: job.description || '',
      ApplyOfficialLink: job.otherLink || '', ApplyPdfLink: job.applyPdfLink || '',
      FullInformationImagesHtml: job.fullInformationTableFormat || '', FullJobInformationHtml: job.fullJobInformation || '',
      WalkInDate: job.walkInDate || '', LastDateToApply: job.lastDateToApply || '', CreatedBy: job.createdBy || '', CreatedDate: job.createdDate || ''
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Jobs');
    XLSX.writeFile(workbook, `freejob-jobs-${new Date().toISOString().slice(0, 10)}.xls`, { bookType: 'xls' });
  }

  async importJobs(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.importing = true;
    this.dismissNotice();
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      let imported = 0;
      for (const row of rows) {
        const title = this.excelValue(row, ['JobTitle', 'Job Title', 'Title']).trim();
        const company = this.excelValue(row, ['CompanyName', 'Company Name', 'Company']).trim();
        if (!title || !company) continue;
        const jobType = this.excelValue(row, ['JobType', 'Job Type']) || 'Government Jobs';
        const sector = this.excelValue(row, ['Sector']) || (GOVERNMENT_JOB_TYPES.includes(jobType) ? 'Government' : 'Private');
        const privateJobType = this.excelValue(row, ['PrivateJobType', 'Private Job Type']) || 'Non-walk-in';
        await push(ref(db, 'jobs'), {
          title, company, companyImage: this.excelValue(row, ['CompanyImageHtml', 'CompanyImage']),
          jobIcon: this.excelValue(row, ['JobIcon']) || 'bi-briefcase-fill', sector, privateJobType, jobType,
          experience: this.excelValue(row, ['Experience']), description: this.excelValue(row, ['JobDescription', 'Job Description']),
          otherLink: this.excelValue(row, ['ApplyOfficialLink', 'Apply Official Link']), applyPdfLink: this.excelValue(row, ['ApplyPdfLink', 'Apply PDF Link']),
          fullInformationTableFormat: this.excelValue(row, ['FullInformationImagesHtml', 'FullInformationTableFormat']),
          fullJobInformation: this.excelValue(row, ['FullJobInformationHtml', 'FullJobInformation']),
          walkInDate: this.excelValue(row, ['WalkInDate']), lastDateToApply: this.excelValue(row, ['LastDateToApply']),
          createdBy: this.excelValue(row, ['CreatedBy']), walkInDrive: sector === 'Private' && privateJobType === 'Walk-in',
          createdDate: this.excelValue(row, ['CreatedDate']) || new Date().toISOString()
        });
        imported += 1;
      }
      this.showNotice(`Imported ${imported} jobs.`, 'success');
    } catch {
      this.showNotice('Could not import this spreadsheet. Check its format and try again.', 'error');
    } finally {
      this.importing = false;
      this.cdr.detectChanges();
    }
  }

  imageSource(value?: string): string | null {
    const raw = (value || '').trim();
    const match = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) return match[1];
    return /^(https?:\/\/|data:image\/)/i.test(raw) ? raw : null;
  }

  companyInitial(job: Job): string {
    return (job.company || job.title || 'J').trim().charAt(0).toUpperCase();
  }

  dismissNotice(): void {
    this.notice = '';
    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer);
      this.noticeTimer = null;
    }
  }

  private showNotice(message: string, type: 'success' | 'error' | 'info', autoDismiss = true): void {
    this.notice = message;
    this.noticeType = type;
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.noticeTimer = autoDismiss
      ? setTimeout(() => {
          this.notice = '';
          this.noticeTimer = null;
          this.cdr.detectChanges();
        }, 4000)
      : null;
    this.cdr.detectChanges();
  }

  private excelValue(row: Record<string, unknown>, names: string[]): string {
    const entries = Object.entries(row).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ''), String(value ?? '')]);
    for (const name of names) {
      const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = entries.find(([entry]) => entry === key);
      if (match) return match[1];
    }
    return '';
  }

  private time(value?: string): number {
    const date = new Date(value || '').getTime();
    return Number.isNaN(date) ? 0 : date;
  }
}