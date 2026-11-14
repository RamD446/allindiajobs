import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { browserSessionPersistence, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { onValue, push, ref, remove, set, update } from 'firebase/database';
import * as XLSX from 'xlsx';
import { auth, db } from '../../../config/firebase.config';
import { Job } from '../../models/job.model';

interface CareerLink {
  id: string;
  companyName: string;
  officialUrl: string;
  sector?: 'Government' | 'Private';
  jobType?: string;
}

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
  careerLinks: CareerLink[] = [];
  activeTab: 'jobs' | 'careerLinks' = 'jobs';
  careerDraft = { companyName: '', officialUrl: '', sector: 'Government' as 'Government' | 'Private', jobType: 'Government Jobs' };
  editingCareerId: string | null = null;
  careerFormOpen = false;
  savingCareer = false;
  importingCareers = false;
  pendingDeleteJob: Job | null = null;
  deleting = false;
  search = '';
  filter = 'All job types';
  draft = emptyDraft();
  titleError = false;
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
  private stopCareers: (() => void) | null = null;
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.stopAuth = onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.authLoading = false;
      if (user) {
        this.loadJobs();
        this.loadCareers();
      }
      else {
        this.stopJobs?.();
        this.stopCareers?.();
        this.jobs = [];
        this.careerLinks = [];
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAuth?.();
    this.stopJobs?.();
    this.stopCareers?.();
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
    this.careerFormOpen = false;
    this.editingCareerId = null;
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

  private loadCareers(): void {
    this.stopCareers?.();
    this.stopCareers = onValue(ref(db, 'careerLinks'), (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<CareerLink, 'id'>> | null;
      this.careerLinks = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : [];
      this.careerLinks.sort((first, second) => first.companyName.localeCompare(second.companyName));
      this.cdr.detectChanges();
    }, () => this.showNotice('Could not load career links. Check your database access rules.', 'error'));
  }

  startCreateCareer(): void {
    this.careerDraft = { companyName: '', officialUrl: '', sector: 'Government', jobType: 'Government Jobs' };
    this.editingCareerId = null;
    this.careerFormOpen = true;
    this.dismissNotice();
  }

  startEditCareer(link: CareerLink): void {
    const sector = link.sector || 'Government';
    this.careerDraft = {
      companyName: link.companyName, officialUrl: link.officialUrl, sector,
      jobType: link.jobType || (sector === 'Private' ? 'IT Jobs' : 'Government Jobs')
    };
    this.editingCareerId = link.id;
    this.careerFormOpen = true;
    this.dismissNotice();
  }

  closeCareerForm(): void {
    if (this.savingCareer) return;
    this.careerFormOpen = false;
    this.editingCareerId = null;
  }

  onCareerSectorChange(): void {
    this.careerDraft.jobType = this.careerDraft.sector === 'Government' ? 'Government Jobs' : 'IT Jobs';
  }

  async saveCareer(): Promise<void> {
    if (this.savingCareer) return;
    const companyName = this.careerDraft.companyName.trim();
    const officialUrl = this.careerDraft.officialUrl.trim();
    if (!companyName || !/^https?:\/\/\S+$/i.test(officialUrl)) {
      this.showNotice('Enter a company name and a valid official URL.', 'error');
      return;
    }
    this.savingCareer = true;
    const wasEditing = Boolean(this.editingCareerId);
    try {
      const record = { companyName, officialUrl, sector: this.careerDraft.sector, jobType: this.careerDraft.jobType };
      if (this.editingCareerId) await set(ref(db, `careerLinks/${this.editingCareerId}`), record);
      else await push(ref(db, 'careerLinks'), record);
      this.closeCareerFormAfterSave();
      this.showNotice(wasEditing ? 'Career link updated.' : 'Career link created.', 'success');
    } catch {
      this.showNotice('Unable to save career link. Check database permissions.', 'error');
    } finally {
      this.savingCareer = false;
      this.cdr.detectChanges();
    }
  }

  private closeCareerFormAfterSave(): void {
    this.careerFormOpen = false;
    this.careerDraft = { companyName: '', officialUrl: '', sector: 'Government', jobType: 'Government Jobs' };
    this.editingCareerId = null;
  }

  async deleteCareer(link: CareerLink): Promise<void> {
    if (!window.confirm(`Delete the career link for ${link.companyName}?`)) return;
    try {
      await remove(ref(db, `careerLinks/${link.id}`));
      this.showNotice('Career link deleted.', 'success');
    } catch {
      this.showNotice('Unable to delete career link. Check database permissions.', 'error');
    }
  }

  exportCareers(): void {
    const rows = this.careerLinks.map(({ companyName, officialUrl, sector, jobType }) => ({
      'Company name': companyName, 'Official URL': officialUrl,
      Sector: sector || 'Government', 'Job type': jobType || (sector === 'Private' ? 'IT Jobs' : 'Government Jobs')
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows, { header: ['Company name', 'Official URL', 'Sector', 'Job type'] }), 'Career Links');
    XLSX.writeFile(workbook, `career-links-${new Date().toISOString().slice(0, 10)}.xls`, { bookType: 'xls' });
  }

  async importCareers(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.importingCareers) return;
    this.importingCareers = true;
    this.dismissNotice();
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      let imported = 0;
      for (const row of rows) {
        const companyName = this.excelValue(row, ['CompanyName', 'Company Name']).trim();
        const officialUrl = this.excelValue(row, ['OfficialURL', 'Official URL']).trim();
        if (!companyName || !/^https?:\/\/\S+$/i.test(officialUrl)) continue;
        const sector = this.excelValue(row, ['Sector']).trim() === 'Private' ? 'Private' : 'Government';
        const importedType = this.excelValue(row, ['Job type']).trim();
        const types = sector === 'Government' ? GOVERNMENT_JOB_TYPES : PRIVATE_JOB_TYPES;
        const jobType = types.includes(importedType) ? importedType : types[0];
        await push(ref(db, 'careerLinks'), { companyName, officialUrl, sector, jobType });
        imported += 1;
      }
      this.showNotice(`Imported ${imported} career links.`, 'success');
    } catch {
      this.showNotice('Could not import career links. Check the spreadsheet and try again.', 'error');
    } finally {
      this.importingCareers = false;
      this.cdr.detectChanges();
    }
  }

  startCreate(): void {
    this.draft = emptyDraft();
    this.titleError = false;
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
    this.titleError = false;
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

  closeForm(): void {
    if (this.saving) return;
    this.formOpen = false;
    this.editingId = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.pendingDeleteJob) this.cancelDelete();
    else if (this.careerFormOpen) this.closeCareerForm();
    else this.closeForm();
  }

  async saveJob(): Promise<void> {
    if (this.saving) return;
    if (!this.draft.title.trim()) {
      this.titleError = true;
      return;
    }
    this.titleError = false;
    const wasEditing = Boolean(this.editingId);
    this.dismissNotice();
    const sector = this.draft.sector || 'Government';
    const privateJobType = this.draft.privateJobType || 'Non-walk-in';
    const record = {
      ...this.draft,
      title: this.draft.title.trim(),
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
    const rows = this.jobs.map((job) => {
      const oldType = job.jobType || '';
      const sector = job.sector || (GOVERNMENT_JOB_TYPES.includes(oldType) ? 'Government' : 'Private');
      const types = sector === 'Government' ? GOVERNMENT_JOB_TYPES : PRIVATE_JOB_TYPES;
      const jobType = types.includes(oldType) ? oldType : types[0];
      const privateJobType = job.privateJobType || (job.walkInDrive || oldType === 'Walk-ins' ? 'Walk-in' : 'Non-walk-in');
      return {
        'Job title': job.title || '', Company: job.company || '', Sector: sector,
        'Job type': jobType, 'Last date to apply': sector === 'Government' && jobType === 'Government Jobs' ? job.lastDateToApply || '' : '',
        'Private hiring type': sector === 'Private' ? privateJobType : '',
        'Walk-in date': sector === 'Private' && privateJobType === 'Walk-in' ? job.walkInDate || '' : '',
        'Experience type': job.experience || '',
        'Company image URL': job.companyImage || '', 'Official application URL': job.otherLink || '',
        'PDF URL': job.applyPdfLink || '', 'Created by': job.createdBy || '',
        'Job icon': job.jobIcon || 'bi-briefcase-fill', Description: job.description || '',
        'Job information rows': job.fullInformationTableFormat || '', 'Full notification': job.fullJobInformation || ''
      };
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows, { header: [
      'Job title', 'Company', 'Sector', 'Job type', 'Last date to apply', 'Private hiring type',
      'Walk-in date', 'Experience type', 'Company image URL', 'Official application URL',
      'PDF URL', 'Created by', 'Job icon', 'Description', 'Job information rows', 'Full notification'
    ] }), 'Jobs');
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
        const title = this.excelValue(row, ['Job title', 'Title']).trim();
        const company = this.excelValue(row, ['Company', 'Company name']).trim();
        if (!title || !company) continue;
        const importedType = this.excelValue(row, ['Job type']).trim();
        const importedSector = this.excelValue(row, ['Sector']).trim();
        const sector = importedSector === 'Government' || importedSector === 'Private'
          ? importedSector : PRIVATE_JOB_TYPES.includes(importedType) ? 'Private' : 'Government';
        const types = sector === 'Private' ? PRIVATE_JOB_TYPES : GOVERNMENT_JOB_TYPES;
        const jobType = types.includes(importedType) ? importedType : types[0];
        const privateJobType = this.excelValue(row, ['Private hiring type', 'PrivateJobType']) === 'Walk-in' ? 'Walk-in' : 'Non-walk-in';
        await push(ref(db, 'jobs'), {
          title, company, companyImage: this.excelValue(row, ['Company image URL', 'CompanyImageHtml', 'CompanyImage']),
          jobIcon: this.excelValue(row, ['JobIcon']) || 'bi-briefcase-fill', sector, privateJobType, jobType,
          experience: this.excelValue(row, ['Experience type', 'Experience']), description: this.excelValue(row, ['Description', 'JobDescription']),
          otherLink: this.excelValue(row, ['Official application URL', 'ApplyOfficialLink']), applyPdfLink: this.excelValue(row, ['PDF URL', 'ApplyPdfLink']),
          fullInformationTableFormat: this.excelValue(row, ['Job information rows', 'FullInformationImagesHtml', 'FullInformationTableFormat']),
          fullJobInformation: this.excelValue(row, ['Full notification', 'FullJobInformationHtml', 'FullJobInformation']),
          walkInDate: sector === 'Private' && privateJobType === 'Walk-in' ? this.excelValue(row, ['Walk-in date']) : '',
          lastDateToApply: sector === 'Government' && jobType === 'Government Jobs' ? this.excelValue(row, ['Last date to apply']) : '',
          createdBy: this.excelValue(row, ['CreatedBy']), walkInDrive: sector === 'Private' && privateJobType === 'Walk-in',
          createdDate: new Date().toISOString()
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