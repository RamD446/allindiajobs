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

  quickLinks = [
    { name: 'Home', route: '/' },
    { name: 'All Govt Jobs', route: '/government-jobs' },
    { name: 'All Walk-in Interviews', route: '/walk-in-drives' },
    { name: 'All Private Jobs', route: '/private-jobs' },
    { name: 'Govt Job Results', route: '/government-job-results' },
    { name: 'Current Affairs', route: '/current-affairs' }
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
