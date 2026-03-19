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
    { name: 'All Govt Jobs', route: '/government-jobs', icon: 'bi-building-fill', color: '#1565c0' },
    { name: 'All Walk-ins', route: '/walk-in-drives', icon: 'bi-person-walking', color: '#0288d1' },
    { name: 'Today Walk-ins', route: '/today-walkins', icon: 'bi-person-walking', color: '#0288d1' },
    { name: 'Current Affairs', route: '/current-affairs', icon: 'bi-newspaper', color: '#e65100' }
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
