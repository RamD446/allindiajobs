import { Component, HostListener, OnInit, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { onValue, ref } from 'firebase/database';
import { db } from '../../../config/firebase.config';
import { FormsModule } from '@angular/forms';
import { Job } from '../../models/job.model';

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
  isSearchModalOpen = false;
  isGamesDropdownOpen = false;
  searchQuery = '';
  searchResults: Job[] = [];
  jobs: Job[] = [];
  selectedHeaderCategory = '';
  selectedJobTypeFilter = '';
  selectedExperienceFilter = '';
  selectedEducationFilter = '';
  selectedLocationFilter = '';
  showScrollUp = false;
  homeCategoryOptions = [
    { value: 'IT Walk-ins', label: 'IT Jobs' },
    { value: 'BPO/Non-IT Walk-ins', label: 'BPO/Non-IT Jobs' },
    { value: 'Sales Walk-ins', label: 'Sales Jobs' },
    { value: 'Banking Walk-ins', label: 'Banking Jobs' },
    { value: 'Pharma Walk-ins', label: 'Pharma Jobs' }
  ];

  homeFilterOptions = [
    ...this.homeCategoryOptions
  ];

  jobTypeOptions = [
    { value: 'Walk-ins', label: 'Walk-ins Jobs' },
    { value: 'Non-Walkins', label: 'Non-Walkins Jobs' }
  ];
  experienceOptions: string[] = ['Freshers', 'Experienced'];
  educationOptions: string[] = ['B.Tech', 'Degree', 'Any Graduate'];
  locationOptions: string[] = ['Vishakhapatnam', 'Hyderabad', 'Bengaluru'];

  offcanvasFilters = [
    { name: 'All', route: '/', queryParams: this.createFilterQueryParams(), icon: 'bi-grid', color: '#0f766e' },
    { name: 'Walk-ins', route: '/', queryParams: this.createFilterQueryParams({ category: 'Walk-ins' }), icon: 'bi-person-walking', color: '#1565c0' },
    { name: 'Non-Walkins', route: '/', queryParams: this.createFilterQueryParams({ category: 'Non-Walkins' }), icon: 'bi-briefcase', color: '#1d4ed8' },
    { name: 'B.Tech', route: '/', queryParams: this.createFilterQueryParams({ category: 'B.Tech' }), icon: 'bi-mortarboard', color: '#0ea5e9' },
    { name: 'Degree', route: '/', queryParams: this.createFilterQueryParams({ category: 'Degree' }), icon: 'bi-award', color: '#0284c7' },
    { name: 'Any Graduate', route: '/', queryParams: this.createFilterQueryParams({ category: 'Any Graduate' }), icon: 'bi-journal-check', color: '#0369a1' },
    { name: 'Freshers', route: '/', queryParams: this.createFilterQueryParams({ category: 'Freshers' }), icon: 'bi-stars', color: '#0d9488' },
    { name: 'Experienced', route: '/', queryParams: this.createFilterQueryParams({ category: 'Experienced' }), icon: 'bi-briefcase-fill', color: '#14b8a6' },
    { name: 'Vishakhapatnam', route: '/', queryParams: this.createFilterQueryParams({ category: 'Vishakhapatnam' }), icon: 'bi-geo-alt', color: '#0891b2' },
    { name: 'Hyderabad', route: '/', queryParams: this.createFilterQueryParams({ category: 'Hyderabad' }), icon: 'bi-geo-alt-fill', color: '#0e7490' },
    { name: 'Bengaluru', route: '/', queryParams: this.createFilterQueryParams({ category: 'Bengaluru' }), icon: 'bi-building', color: '#155e75' },
    { name: 'IT Jobs', route: '/', queryParams: this.createFilterQueryParams({ category: 'IT Walk-ins' }), icon: 'bi-laptop', color: '#1e3a8a' },
    { name: 'BPO/Non-IT Jobs', route: '/', queryParams: this.createFilterQueryParams({ category: 'BPO/Non-IT Walk-ins' }), icon: 'bi-headset', color: '#3730a3' },
    { name: 'Sales Jobs', route: '/', queryParams: this.createFilterQueryParams({ category: 'Sales Walk-ins' }), icon: 'bi-graph-up-arrow', color: '#4f46e5' },
    { name: 'Banking Jobs', route: '/', queryParams: this.createFilterQueryParams({ category: 'Banking Walk-ins' }), icon: 'bi-bank', color: '#6d28d9' },
    { name: 'Pharma Jobs', route: '/', queryParams: this.createFilterQueryParams({ category: 'Pharma Walk-ins' }), icon: 'bi-capsule', color: '#7c3aed' }
  ];

  private createFilterQueryParams(filters?: { category?: string }) {
    return {
      category: filters?.category || null,
      jobType: null,
      experience: null,
      education: null,
      location: null
    };
  }

  constructor(private cdr: ChangeDetectorRef, private el: ElementRef, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.loadJobs();
    this.updateScrollButtonState();

    this.route.queryParamMap.subscribe((params) => {
      this.selectedHeaderCategory = params.get('category') || '';
      this.syncDropdownSelections(this.selectedHeaderCategory);
    });
  }

  onHeaderQuickFilterChange() {
    const queryParams: Record<string, string | null> = {
      category: this.selectedHeaderCategory || null,
      jobType: null,
      experience: null,
      education: null,
      location: null
    };

    this.router.navigate(['/'], { queryParams });
  }

  setHeaderCategory(category: string) {
    this.selectedHeaderCategory = category;
    this.syncDropdownSelections(category);
    this.onHeaderQuickFilterChange();
  }

  onJobTypeChange() {
    if (!this.selectedJobTypeFilter) {
      return;
    }

    this.setHeaderCategory(this.selectedJobTypeFilter);
  }

  onExperienceChange() {
    if (!this.selectedExperienceFilter) {
      return;
    }

    this.setHeaderCategory(this.selectedExperienceFilter);
  }

  onEducationChange() {
    if (!this.selectedEducationFilter) {
      return;
    }

    this.setHeaderCategory(this.selectedEducationFilter);
  }

  onLocationChange() {
    if (!this.selectedLocationFilter) {
      return;
    }

    this.setHeaderCategory(this.selectedLocationFilter);
  }

  private syncDropdownSelections(category: string) {
    if (this.jobTypeOptions.some((item) => item.value === category)) {
      this.selectedJobTypeFilter = category;
    } else {
      this.selectedJobTypeFilter = '';
    }

    if (this.experienceOptions.includes(category)) {
      this.selectedExperienceFilter = category;
    } else {
      this.selectedExperienceFilter = '';
    }

    if (this.educationOptions.includes(category)) {
      this.selectedEducationFilter = category;
    } else {
      this.selectedEducationFilter = '';
    }

    if (this.locationOptions.includes(category)) {
      this.selectedLocationFilter = category;
    } else {
      this.selectedLocationFilter = '';
    }
  }

  resetToAllJobs() {
    this.selectedHeaderCategory = '';
    this.selectedJobTypeFilter = '';
    this.selectedExperienceFilter = '';
    this.selectedEducationFilter = '';
    this.selectedLocationFilter = '';

    this.router.navigate(['/'], {
      queryParams: {
        category: null,
        jobType: null,
        experience: null,
        education: null,
        location: null
      },
      queryParamsHandling: 'merge'
    });
  }

  private resolveHeaderTargetRoute(categorySelection: string): string {
    if (categorySelection === 'walkin') {
      return '/walkinjobs';
    }

    if (categorySelection === 'nonwalkin') {
      return '/non-walkinjobs';
    }

    return '/';
  }

  private resolveHeaderCategoryFilter(categorySelection: string): string | null {
    if (categorySelection === 'it') return 'IT Walk-ins';
    if (categorySelection === 'bpo') return 'BPO/Non-IT Walk-ins';
    if (categorySelection === 'banking') return 'Banking Walk-ins';
    if (categorySelection === 'pharma') return 'Pharma Walk-ins';
    if (categorySelection === 'sales') return 'Sales Walk-ins';
    return null;
  }

  private resolveHeaderCategorySelection(path: string, categoryParam: string | null): string {
    if (path.includes('/walkinjobs')) return 'walkin';
    if (path.includes('/non-walkinjobs')) return 'nonwalkin';
    if (categoryParam === 'IT Walk-ins') return 'it';
    if (categoryParam === 'BPO/Non-IT Walk-ins') return 'bpo';
    if (categoryParam === 'Banking Walk-ins') return 'banking';
    if (categoryParam === 'Pharma Walk-ins') return 'pharma';
    if (categoryParam === 'Sales Walk-ins') return 'sales';
    return 'all';
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

  getJobCountByCategory(category: string): number {
    if (category === 'All') return this.jobs.length;
    if (category === 'Banking Jobs') {
      return this.jobs.filter(job => 
        job.category && (job.category.toLowerCase().includes('bank') || job.category.includes('SBI') || job.category.includes('IBPS') || job.category.includes('RBI'))
      ).length;
    }
    return this.jobs.filter(job => job.category === category).length;
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

  performSearch() {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }
    const query = this.searchQuery.toLowerCase().trim();
    this.searchResults = this.jobs.filter(job => 
      job.title?.toLowerCase().includes(query) || 
      job.category?.toLowerCase().includes(query) ||
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

  joinWhatsAppGroup() {
    window.open('https://whatsapp.com/channel/0029VbCLJWjCRs1nIKjUlh3p', '_blank');
  }

  handleScrollDirectionClick() {
    if (this.showScrollUp) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.scrollTo({ top: window.scrollY + window.innerHeight, behavior: 'smooth' });
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.updateScrollButtonState();
  }

  private updateScrollButtonState() {
    this.showScrollUp = window.scrollY > 160;
  }
}
