import { Component, HostListener, OnInit, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { onValue, ref } from 'firebase/database';
import { db, auth } from '../../../config/firebase.config';
import { FormsModule } from '@angular/forms';
import { Job, getCategoryDisplayLabel } from '../../models/job.model';
import { onAuthStateChanged, signOut } from 'firebase/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isNavActive = false;
  isLoggedIn: boolean = false;
  currentUser: any = null;
  isSearchModalOpen = false;
  isGamesDropdownOpen = false;
  isCompanyFilterModalOpen = false;
  searchQuery = '';
  searchResults: Job[] = [];
  jobs: Job[] = [];
  selectedCompanyFilter = '';

  getCategoryDisplayLabel(category: string): string {
    return getCategoryDisplayLabel(category);
  }

  get topJobsTicker(): Job[] {
    return this.jobs
      .slice()
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 30);
  }

  get detailPageFilterLabels(): Array<{ label: string; route: string; icon: string }> {
    return [
      { label: 'Home', route: '/', icon: 'bi-house-door-fill' },
      { label: 'Government Jobs', route: '/job-category/government-jobs', icon: 'bi-bank2' },
      { label: 'Private Walk-ins', route: '/job-category/walk-ins', icon: 'bi-person-walking' },
      { label: 'Fresher Jobs', route: '/job-category/freshers', icon: 'bi-mortarboard-fill' },
      { label: 'Experienced Jobs', route: '/job-category/experienced', icon: 'bi-briefcase-fill' },
      { label: 'Results', route: '/job-category/results', icon: 'bi-file-earmark-check-fill' },
      { label: 'Career Tips', route: '/job-category/career-tips', icon: 'bi-lightbulb-fill' },
      { label: 'Syllabus', route: '/job-category/syllabus', icon: 'bi-journal-bookmark-fill' }
    ];
  }

  get isHomePageTickerVisible(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/' || url.startsWith('/job-category') || url.includes('/walkinjobs') || url.includes('/non-walkinjobs');
  }

  getCompanyOptions(): string[] {
    const names = Array.from(new Set(this.jobs.map(job => (job.company || '').trim()).filter(name => !!name)));
    return names.sort((a, b) => a.localeCompare(b));
  }

  onCompanyFilterChange(): void {
    this.isNavActive = false;
    if (!this.selectedCompanyFilter) {
      this.router.navigate(['/']);
      return;
    }
    this.router.navigate(['/'], { queryParams: { company: this.selectedCompanyFilter } });
  }

  toggleCompanyFilterModal(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isCompanyFilterModalOpen = !this.isCompanyFilterModalOpen;
  }

  closeCompanyFilterModal() {
    this.isCompanyFilterModalOpen = false;
  }

  getGovernmentJobsCompanies(): string[] {
    const names = Array.from(new Set(
      this.jobs
        .filter(job => job.jobType === 'Government Jobs')
        .map(job => (job.company || '').trim())
        .filter(name => !!name)
    ));
    return names.sort((a, b) => a.localeCompare(b));
  }

  getWalkInJobsCompanies(): string[] {
    const names = Array.from(new Set(
      this.jobs
        .filter(job => job.walkInDrive === true)
        .map(job => (job.company || '').trim())
        .filter(name => !!name)
    ));
    return names.sort((a, b) => a.localeCompare(b));
  }

  filterByCompany(companyName: string): void {
    this.selectedCompanyFilter = companyName;
    this.closeCompanyFilterModal();
    this.router.navigate(['/'], { queryParams: { company: companyName } });
  }

  offcanvasFilters = [
    { name: 'All Latest Jobs', route: '/job-category/all', icon: 'bi-grid', color: '#0f766e' },
    { name: 'Government Jobs', route: '/job-category/government-jobs', icon: 'bi-building-check', color: '#9333ea' },
    { name: 'Private Walk-ins', route: '/job-category/walk-ins', icon: 'bi-person-walking', color: '#1565c0' },
    { name: 'Fresher Jobs', route: '/job-category/freshers', icon: 'bi-stars', color: '#0d9488' },
    { name: 'Experienced Jobs', route: '/job-category/experienced', icon: 'bi-briefcase-fill', color: '#14b8a6' },
    { name: 'Results', route: '/job-category/results', icon: 'bi-clipboard-check', color: '#b45309' },
    { name: 'Career Tips', route: '/job-category/career-tips', icon: 'bi-lightbulb', color: '#7c3aed' },
    { name: 'Syllabus', route: '/job-category/syllabus', icon: 'bi-journal-text', color: '#0891b2' }
  ];

  constructor(private cdr: ChangeDetectorRef, private el: ElementRef, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.loadJobs();
    
    // Listen to authentication state
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.isLoggedIn = true;
        this.currentUser = user;
        this.cdr.detectChanges();
      } else {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.cdr.detectChanges();
      }
    });
  }

  loadJobs() {
    try {
      const jobsRef = ref(db, 'jobs');
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.jobs = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          })).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
        }
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error loading jobs for header:', error);
    }
  }

  getTodayWalkinsCount(): number {
    return this.jobs.filter(job => job.walkInDrive === true).length;
  }

  isJobDetailsPage(): boolean {
    return this.router.url.startsWith('/job/');
  }

  toggleNav(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isNavActive = !this.isNavActive;
  }

  closeNav() {
    this.isNavActive = false;
  }

  async logout() {
    try {
      await signOut(auth);
      this.isLoggedIn = false;
      this.currentUser = null;
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  toggleSearchModal(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isSearchModalOpen = !this.isSearchModalOpen;
    if (this.isSearchModalOpen) {
      this.searchQuery = '';
      this.searchResults = [];
    }
  }

  closeSearchModal() {
    this.isSearchModalOpen = false;
  }

  toggleGamesDropdown(event: Event) {
    event.stopPropagation();
    this.isGamesDropdownOpen = !this.isGamesDropdownOpen;
  }

  closeGamesDropdown() {
    this.isGamesDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isCompanyFilterModalOpen) {
      const target = event.target as HTMLElement;
      const modal = this.el.nativeElement.querySelector('.company-filter-modal');
      if (modal && !modal.contains(target)) {
        this.closeCompanyFilterModal();
      }
    }
  }

  performSearch() {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }
    const query = this.searchQuery.toLowerCase().trim();
    this.searchResults = this.jobs.filter(job => 
      job.title?.toLowerCase().includes(query) || 
      job.jobType?.toLowerCase().includes(query) ||
      this.toPlainText(job.description || '').toLowerCase().includes(query)
    ).slice(0, 10);
  }

  private toPlainText(html: string): string {
    return html.replace(/<[^>]*>/g, ' ');
  }

  viewJobDetails(job: Job) {
    const titleSlug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    this.router.navigate(['/job', job.id, titleSlug], { state: { job } }).then(() => {
      this.closeSearchModal();
      window.scrollTo(0, 0);
    });
  }

  shareApp() {
    if (navigator.share) {
      navigator.share({
        title: 'AllJobs Portal',
        text: 'Find latest walk-in interviews and jobs across India.',
        url: window.location.origin
      });
    } else {
      alert('Sharing not supported on this browser');
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.isNavActive || this.isGamesDropdownOpen) {
      const clickedInside = this.el.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.closeNav();
        this.closeGamesDropdown();
      }
    }
  }

  openExternalChannel(url: string) {
    window.open(url, '_blank', 'noopener');
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if (window.innerWidth > 991) {
      this.isNavActive = false;
    }
  }

  
}
