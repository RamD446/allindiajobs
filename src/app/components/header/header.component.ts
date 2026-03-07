import { Component, HostListener, OnInit, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { onValue, ref } from 'firebase/database';
import { db } from '../../../config/firebase.config';
import { Job } from '../../models/job.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isNavActive = false;
  jobs: Job[] = [];

  navCategories = [
    { name: 'Government Jobs', route: '/government-jobs', icon: 'bi-building-fill', color: '#e65100' },
    { name: 'Private Jobs', route: '/private-jobs', icon: 'bi-briefcase-fill', color: '#2e7d32' },
    { name: 'Walk-in Drives', route: '/walk-in-drives', icon: 'bi-person-walking', color: '#c2185b' },
    { name: 'Banking Jobs', route: '/banking-jobs', icon: 'bi-piggy-bank-fill', color: '#1565c0' },
    { name: 'Fresher Jobs', route: '/fresher-jobs', icon: 'bi-mortarboard-fill', color: '#2e7d32' },
    { name: 'IT Jobs', route: '/it-jobs', icon: 'bi-laptop-fill', color: '#0277bd' },
    { name: 'Career Tips', route: '/health-and-career-tips', icon: 'bi-heart-pulse-fill', color: '#0288d1' },
    { name: 'English Learning', route: '/telugu-to-english-learning', icon: 'bi-translate', color: '#7b1fa2' }
  ];

  constructor(private cdr: ChangeDetectorRef, private el: ElementRef) {}

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
          }));
        }
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error loading jobs for header:', error);
    }
  }

  getJobCountByCategory(category: string): number {
    if (category === 'All') return this.jobs.length;
    if (category === 'Banking Jobs') {
      return this.jobs.filter(job => 
        job.category && (job.category.toLowerCase().includes('bank') || job.category.includes('SBI') || job.category.includes('IBPS') || job.category.includes('RBI'))
      ).length;
    }
    if (category === 'All Private Jobs') {
       return this.jobs.filter(job => 
        job.category === 'All Private Jobs' || 
        job.category === 'Walk-in Drives' ||
        (job.category && (job.category.toLowerCase().includes('bank') || job.category.includes('SBI') || job.category.includes('IBPS') || job.category.includes('RBI')))
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

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.isNavActive) {
      const clickedInside = this.el.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.closeNav();
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
