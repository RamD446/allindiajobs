import { Component, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isInstallPromptEvent(event: Event): event is InstallPromptEvent {
  return 'prompt' in event && typeof event.prompt === 'function' &&
    'userChoice' in event && event.userChoice instanceof Promise;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  private deferredPrompt: InstallPromptEvent | null = null;
  showInstallBtn = false;
  showInstallInstructions = false;
  isInstalled = (window.matchMedia?.('(display-mode: standalone)').matches ?? false) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
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
  onBeforeInstallPrompt(event: Event) {
    if (!isInstallPromptEvent(event)) {
      console.error('Browser sent an invalid app installation prompt.');
      return;
    }
    event.preventDefault();
    this.deferredPrompt = event;
    this.showInstallBtn = !this.isInstalled;
  }

  @HostListener('window:appinstalled')
  onAppInstalled() {
    this.isInstalled = true;
    this.showInstallBtn = false;
    this.showInstallInstructions = false;
    this.deferredPrompt = null;
  }

  async installApp() {
    const prompt = this.deferredPrompt;
    if (!prompt) {
      this.showInstallInstructions = !this.showInstallInstructions;
      return;
    }

    this.deferredPrompt = null;
    this.showInstallBtn = false;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'dismissed') {
        this.showInstallInstructions = true;
      }
    } catch (error) {
      console.error('Unable to open app installation prompt:', error);
      this.showInstallInstructions = true;
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
