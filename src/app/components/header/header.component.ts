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
  selectedHeaderJobType = 'All';
  showScrollUp = false;
  homeJobTypeOptions: string[] = ['All', 'Walk-ins', 'Non-Walkins'];

  navCategories = [
    { name: 'IT Walk-ins', route: '/IT-Walk-ins', icon: 'bi-person-walking', color: '#1565c0' },
    { name: 'BPO/Non-IT Walk-ins', route: '/BPO-Non-IT-Walk-ins', icon: 'bi-person-walking', color: '#0288d1' },
    { name: 'Fresher Walk-ins', route: '/Fresher-Walk-ins', icon: 'bi-person-walking', color: '#0097a7' },
    { name: 'Sales Walk-ins', route: '/Sales-Walk-ins', icon: 'bi-person-walking', color: '#00796b' },
    { name: 'Banking Walk-ins', route: '/Banking-Walk-ins', icon: 'bi-person-walking', color: '#388e3c' },
    { name: 'Pharma Walk-ins', route: '/Pharma-Walk-ins', icon: 'bi-person-walking', color: '#7b1fa2' }
  ];

  constructor(private cdr: ChangeDetectorRef, private el: ElementRef, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.loadJobs();
    this.updateScrollButtonState();

    this.route.queryParamMap.subscribe((params) => {
      this.selectedHeaderJobType = params.get('jobType') || 'All';
    });
  }

  onHeaderQuickFilterChange() {
    const queryParams: Record<string, string | null> = {
      jobType: this.selectedHeaderJobType !== 'All' ? this.selectedHeaderJobType : null,
      location: null
    };

    this.router.navigate(['/'], { queryParams, queryParamsHandling: 'merge' });
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
