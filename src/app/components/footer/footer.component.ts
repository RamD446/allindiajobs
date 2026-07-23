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
    { name: 'Home', route: '/' },
    { name: 'Walk-ins', route: '/', queryParams: { category: 'Walk-ins' } },
    { name: 'Non-Walkins', route: '/', queryParams: { category: 'Non-Walkins' } },
    { name: 'IT Walk-ins', route: '/', queryParams: { category: 'IT Walk-ins' } },
    { name: 'BPO/Non-IT Walk-ins', route: '/', queryParams: { category: 'BPO/Non-IT Walk-ins' } },
    { name: 'Sales Walk-ins', route: '/', queryParams: { category: 'Sales Walk-ins' } },
    { name: 'Banking Walk-ins', route: '/', queryParams: { category: 'Banking Walk-ins' } },
    { name: 'Pharma Walk-ins', route: '/', queryParams: { category: 'Pharma Walk-ins' } }
  ];

  educationLinks: Array<{ name: string; route: string; queryParams?: Record<string, string | null> }> = [
    { name: 'B.Tech', route: '/', queryParams: { category: 'B.Tech' } },
    { name: 'Degree', route: '/', queryParams: { category: 'Degree' } },
    { name: 'Any Graduate', route: '/', queryParams: { category: 'Any Graduate' } },
    { name: 'Freshers', route: '/', queryParams: { category: 'Freshers' } },
    { name: 'Experienced', route: '/', queryParams: { category: 'Experienced' } }
  ];

  locationLinks: Array<{ name: string; route: string; queryParams?: Record<string, string | null> }> = [
    { name: 'Vishakhapatnam', route: '/', queryParams: { category: 'Vishakhapatnam' } },
    { name: 'Hyderabad', route: '/', queryParams: { category: 'Hyderabad' } },
    { name: 'Bengaluru', route: '/', queryParams: { category: 'Bengaluru' } }
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
