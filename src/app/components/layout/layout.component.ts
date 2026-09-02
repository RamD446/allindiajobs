import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  isLoginPage = false;

  constructor(private router: Router) {
    this.updateIsLoginPage();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => this.updateIsLoginPage());
  }

  private updateIsLoginPage() {
    this.isLoginPage = this.router.url.split('?')[0].split('#')[0].startsWith('/login');
  }
}
