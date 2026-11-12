import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit, OnDestroy {
  readonly whatsappUrl = 'https://whatsapp.com/channel/0029VbCLJWjCRs1nIKjUlh3p';
  installPrompt: InstallPromptEvent | null = null;
  installMessage = '';

  private readonly captureInstallPrompt = (event: Event): void => {
    event.preventDefault();
    this.installPrompt = event as InstallPromptEvent;
  };

  private readonly markInstalled = (): void => {
    this.installPrompt = null;
    this.installMessage = 'App installed.';
  };

  ngOnInit(): void {
    window.addEventListener('beforeinstallprompt', this.captureInstallPrompt);
    window.addEventListener('appinstalled', this.markInstalled);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.captureInstallPrompt);
    window.removeEventListener('appinstalled', this.markInstalled);
  }

  async installApp(): Promise<void> {
    if (!this.installPrompt) {
      const appleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      this.installMessage = appleMobile
        ? 'Open the Share menu, then choose Add to Home Screen.'
        : 'Open your browser menu and choose Install app or Add to Home screen.';
      return;
    }

    try {
      await this.installPrompt.prompt();
      const choice = await this.installPrompt.userChoice;
      this.installMessage = choice.outcome === 'accepted' ? 'App installed.' : '';
    } catch {
      this.installMessage = 'Open your browser menu and choose Install app or Add to Home screen.';
    } finally {
      this.installPrompt = null;
    }
  }
}