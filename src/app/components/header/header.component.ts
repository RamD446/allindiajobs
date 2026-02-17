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
  canInstall = false;
  private deferredPrompt: any = null;
  jobs: Job[] = [];

  constructor(private cdr: ChangeDetectorRef, private el: ElementRef) {}

  ngOnInit() {
    this.loadJobs();
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      setTimeout(() => {
        this.canInstall = true;
        this.cdr.detectChanges();
      });
    });

    window.addEventListener('appinstalled', () => {
      setTimeout(() => {
        this.canInstall = false;
        this.deferredPrompt = null;
        this.cdr.detectChanges();
      });
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

  installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: any) => {
        this.deferredPrompt = null;
        this.canInstall = false;
        this.cdr.detectChanges();
      });
    }
  }

  shareWebsite() {
    const shareData = {
      title: 'AllIndia Jobs',
      text: 'Find the best job opportunities in India!',
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
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
