import { Component, HostListener, OnInit, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { onValue, ref } from 'firebase/database';
import { db } from '../../../config/firebase.config';
import { FormsModule } from '@angular/forms';
import { Job, getCategoryDisplayLabel } from '../../models/job.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isNavActive = false;
  isEducationMenuOpen = false;
  isLocationMenuOpen = false;
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
  
  homeCategoryOptions = [
    { value: 'IT Walk-ins', label: 'IT Jobs' },
    { value: 'BPO/Non-IT Walk-ins', label: 'BPO/Non-IT Jobs' },
    { value: 'Sales Walk-ins', label: 'Sales Jobs' },
    { value: 'Banking Walk-ins', label: 'Banking Jobs' },
    { value: 'Pharma Walk-ins', label: 'Pharma Jobs' }
  ];

  homeFilterOptions = [
    { value: 'Walk-ins', label: 'Walk-ins' },
    { value: 'Non-Walkins', label: 'Non-Walkins' },
    { value: 'Freshers', label: 'Freshers' },
    { value: 'Experienced', label: 'Experienced' },
    ...this.homeCategoryOptions
  ];

  getCategoryDisplayLabel(category: string): string {
    return getCategoryDisplayLabel(category);
  }

  jobTypeOptions = [
    { value: 'Walk-ins', label: 'Walk-ins Jobs' },
    { value: 'Non-Walkins', label: 'Non-Walkins Jobs' }
  ];
  experienceOptions: string[] = ['Freshers', 'Experienced'];
  educationOptions: string[] = ['B.Tech', 'Degree', 'Any Graduate'];
  locationOptions: string[] = ['Vishakhapatnam', 'Hyderabad', 'Bengaluru'];

  offcanvasFilters = [
    { name: 'All', route: '/job-category/all', icon: 'bi-grid', color: '#0f766e' },
    { name: 'Walk-ins', route: '/job-category/walk-ins', icon: 'bi-person-walking', color: '#1565c0' },
    { name: 'Non-Walkins', route: '/job-category/non-walkins', icon: 'bi-briefcase', color: '#1d4ed8' },
    { name: 'B.Tech', route: '/job-category/b-tech', icon: 'bi-mortarboard', color: '#0ea5e9' },
    { name: 'Degree', route: '/job-category/degree', icon: 'bi-award', color: '#0284c7' },
    { name: 'Any Graduate', route: '/job-category/any-graduate', icon: 'bi-journal-check', color: '#0369a1' },
    { name: 'Freshers', route: '/job-category/freshers', icon: 'bi-stars', color: '#0d9488' },
    { name: 'Experienced', route: '/job-category/experienced', icon: 'bi-briefcase-fill', color: '#14b8a6' },
    { name: 'Vishakhapatnam', route: '/job-category/vishakhapatnam', icon: 'bi-geo-alt', color: '#0891b2' },
    { name: 'Hyderabad', route: '/job-category/hyderabad', icon: 'bi-geo-alt-fill', color: '#0e7490' },
    { name: 'Bengaluru', route: '/job-category/bengaluru', icon: 'bi-building', color: '#155e75' },
    { name: 'IT Jobs', route: '/job-category/it-walk-ins', icon: 'bi-laptop', color: '#1e3a8a' },
    { name: 'BPO/Non-IT Jobs', route: '/job-category/bpo-non-it-walk-ins', icon: 'bi-headset', color: '#3730a3' },
    { name: 'Sales Jobs', route: '/job-category/sales-walk-ins', icon: 'bi-graph-up-arrow', color: '#4f46e5' },
    { name: 'Banking Jobs', route: '/job-category/banking-walk-ins', icon: 'bi-bank', color: '#6d28d9' },
    { name: 'Pharma Jobs', route: '/job-category/pharma-walk-ins', icon: 'bi-capsule', color: '#7c3aed' }
  ];

  private readonly educationCategoryNames = new Set(['B.Tech', 'Degree', 'Any Graduate']);
  private readonly locationCategoryNames = new Set(['Vishakhapatnam', 'Hyderabad', 'Bengaluru']);

  get offcanvasPrimaryFilters() {
    return this.offcanvasFilters.filter(
      (item) => !this.educationCategoryNames.has(item.name) && !this.locationCategoryNames.has(item.name)
    );
  }

  get educationOffcanvasFilters() {
    return this.offcanvasFilters.filter((item) => this.educationCategoryNames.has(item.name));
  }

  get locationOffcanvasFilters() {
    return this.offcanvasFilters.filter((item) => this.locationCategoryNames.has(item.name));
  }

  private createFilterQueryParams(filters?: { category?: string }) {
    return {
      category: filters?.category || null,
      jobType: null,
      experience: null,
      education: null,
      location: null
    };
  }

  private getCategoryRoutePath(category: string): string {
    if (!category || category === 'All') {
      return '/job-category/all';
    }

    const slug = category
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `/job-category/${slug}`;
  }

  constructor(private cdr: ChangeDetectorRef, private el: ElementRef, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.loadJobs();
    

    this.route.queryParamMap.subscribe((params) => {
      this.selectedHeaderCategory = params.get('category') || '';
      this.syncDropdownSelections(this.selectedHeaderCategory);
    });
  }

  onHeaderQuickFilterChange() {
    const route = this.getCategoryRoutePath(this.selectedHeaderCategory || 'All');
    this.router.navigate([route]);
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

    this.router.navigate(['/job-category/all']);
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
    this.isEducationMenuOpen = false;
    this.isLocationMenuOpen = false;
  }

  toggleEducationMenu(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isEducationMenuOpen = !this.isEducationMenuOpen;
  }

  toggleLocationMenu(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isLocationMenuOpen = !this.isLocationMenuOpen;
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

  
}
