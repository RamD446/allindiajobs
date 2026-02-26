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
    { name: 'ప్రభుత్వ ఉద్యోగాలు (Govt Jobs)', route: '/government-jobs' },
    { name: 'ప్రైవేట్ ఉద్యోగాలు (Private Jobs)', route: '/private-jobs' },
    { name: 'వాక్-ఇన్స్ (Walk-ins)', route: '/walk-in-drives' },
    { name: 'బ్యాంక్ ఉద్యోగాలు (Bank Jobs)', route: '/banking-jobs' },
    { name: 'ఐటి ఉద్యోగాలు (IT Jobs)', route: '/it-jobs' },
    { name: 'ఆరోగ్య చిట్కాలు (Health Tips)', route: '/health-and-career-tips' },
    { name: 'ప్రేరణాత్మక కథలు (Motivation)', route: '/motivation-stories' }
  ];

  careerTypes = [
    { name: 'ఐటి సేవలు (IT Services MNC)', type: 'IT Services MNC' },
    { name: 'గ్లోబల్ టెక్ (Global Tech)', type: 'Global Tech' },
    { name: 'ప్రభుత్వం (Government)', type: 'Government' },
    { name: 'కేంద్ర ప్రభుత్వం (Central Govt)', type: 'Central Government' }
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
