import { Component, HostListener, OnInit, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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

  navCategories = [
    { name: 'IT Walk-ins', route: '/IT-Walk-ins', icon: 'bi-person-walking', color: '#1565c0' },
    { name: 'BPO/Non-IT Walk-ins', route: '/BPO-Non-IT-Walk-ins', icon: 'bi-person-walking', color: '#0288d1' },
    { name: 'Fresher Walk-ins', route: '/Fresher-Walk-ins', icon: 'bi-person-walking', color: '#0097a7' },
    { name: 'Sales Walk-ins', route: '/Sales-Walk-ins', icon: 'bi-person-walking', color: '#00796b' },
    { name: 'Banking Walk-ins', route: '/Banking-Walk-ins', icon: 'bi-person-walking', color: '#388e3c' },
    { name: 'Pharma Walk-ins', route: '/Pharma-Walk-ins', icon: 'bi-person-walking', color: '#7b1fa2' }
  ];

  constructor(private cdr: ChangeDetectorRef, private el: ElementRef, private router: Router) {}

  ngOnInit() {
    this.loadJobs();
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.jobs.filter(job => {
      if (!job.walkInStartDate) return false;
      const start = new Date(job.walkInStartDate);
      start.setHours(0, 0, 0, 0);
      const end = job.walkInEndDate ? new Date(job.walkInEndDate) : start;
      end.setHours(0, 0, 0, 0);
      return today >= start && today <= end;
    }).length;
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
      job.company?.toLowerCase().includes(query) ||
      job.category?.toLowerCase().includes(query) ||
      job.jobLocation?.toLowerCase().includes(query) ||
      job.walkInInterviewLocation?.toLowerCase().includes(query)
    ).slice(0, 10);
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
        title: 'AllIndiaJobs Portal',
        text: 'Find latest walk-in interviews and jobs across India.',
        url: window.location.origin
      });
    } else {
      alert('Sharing not supported on this browser');
    }
  }

  downloadApp() {
    // Placeholder for download app functionality
    alert('App download coming soon!');
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
