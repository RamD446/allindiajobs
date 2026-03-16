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
    { name: 'All Govt Jobs', route: '/government-jobs' },
    { name: 'All Walk-ins', route: '/walk-in-drives' },
    { name: 'Today Walk-ins', route: '/today-walkins' },
    { name: 'Career Tips', route: '/health-and-career-tips' },
    { name: 'TeluguToEnglish', route: '/telugu-to-english-learning' }
  ];

  careerTypes = [
    { name: 'IT Services MNC', type: 'IT Services MNC' },
    { name: 'Global Tech', type: 'Global Tech' },
    { name: 'Government', type: 'Government' },
    { name: 'Central Government', type: 'Central Government' }
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
    this.router.navigate(['/government-jobs'], { queryParams: { careerType: type } });
    window.scrollTo(0, 0);
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }

  openRdmWebtech() {
    window.open('https://rdmwebtech.com', '_blank');
  }
}
