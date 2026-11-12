import { Component, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  deferredPrompt: any;
  showInstallBtn = false;
  
  constructor(private router: Router) {}

  walkInLinks: Array<{ name: string; route: string; queryParams?: Record<string, string | null> }> = [
    { name: 'Home', route: '/job-category/all' },
    { name: 'Government Jobs', route: '/job-category/government-jobs' },
    { name: 'Private Walk-ins', route: '/job-category/walk-ins' },
    { name: 'Fresher Jobs', route: '/job-category/freshers' },
    { name: 'Experienced Jobs', route: '/job-category/experienced' },
    { name: 'Results', route: '/job-category/results' },
    { name: 'Career Tips', route: '/job-category/career-tips' },
    { name: 'Syllabus', route: '/job-category/syllabus' }
  ];

  gameLinks: Array<{ name: string; route: string; queryParams?: Record<string, string | null> }> = [
    { name: 'Thambola Game', route: '/thambola-game' }
  ];

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: any) {
    e.preventDefault();
    this.deferredPrompt = e;
    this.showInstallBtn = true;
  }

  installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          this.showInstallBtn = false;
        }
        this.deferredPrompt = null;
      });
    }
  }

  shareWebsite() {
    if (navigator.share) {
      navigator.share({
        title: 'AllIndiaJobs - Latest Job Updates',
        text: 'Check out the latest job openings on AllIndiaJobs!',
        url: window.location.origin
      }).catch(console.error);
    } else {
      const url = encodeURIComponent(window.location.origin);
      window.open(`https://wa.me/?text=Check out the latest job openings on AllIndiaJobs: ${url}`, '_blank');
    }
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }

  openRdmWebtech() {
    window.open('https://rdmwebtech.com', '_blank');
  }
}
