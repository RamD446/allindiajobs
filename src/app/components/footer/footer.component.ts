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

  jobTypes = [
    { name: 'Govt Jobs', route: '/government-jobs' },
    { name: 'Private Jobs', route: '/private-jobs' },
    { name: 'Walk-ins', route: '/walk-in-drives' },
    { name: 'Bank Jobs', route: '/banking-jobs' },
    { name: 'IT Jobs', route: '/it-jobs' },
    { name: 'Health Tips', route: '/health-and-career-tips' },
    { name: 'Motivation', route: '/motivation-stories' }
  ];

  careerTypes = [
    { name: 'IT Services MNC', type: 'IT Services MNC' },
    { name: 'Global Tech', type: 'Global Tech' },
    { name: 'Government', type: 'Government' },
    { name: 'Central Govt', type: 'Central Government' }
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

  navigateToCareer(type: string) {
    this.router.navigate(['/all-latest-jobs'], { queryParams: { careerType: type } });
    window.scrollTo(0, 0);
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }

  openRdmWebtech() {
    window.open('https://rdmwebtech.com', '_blank');
  }
}
