import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../config/firebase.config';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  searchOpen = false;
  categoriesOpen = false;
  searchQuery = '';
  authLoading = true;
  isSignedIn = false;
  private stopAuth: (() => void) | null = null;

  readonly categories = [
    { label: 'All jobs', slug: 'all' },
    { label: 'Government jobs', slug: 'government' },
    { label: 'Walk-ins', slug: 'walk-ins' },
    { label: 'Freshers', slug: 'freshers' },
    { label: 'Experienced', slug: 'experienced' }
  ];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.stopAuth = onAuthStateChanged(auth, (user) => {
      this.isSignedIn = Boolean(user);
      this.authLoading = false;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.stopAuth?.();
  }

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
    this.categoriesOpen = false;
  }

  toggleCategories(): void {
    this.categoriesOpen = !this.categoriesOpen;
    this.searchOpen = false;
  }

  submitSearch(): void {
    const query = this.searchQuery.trim();
    void this.router.navigate(['/'], { queryParams: { q: query || null } });
    this.searchOpen = false;
  }

  closeMenus(): void {
    this.searchOpen = false;
    this.categoriesOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenus();
  }
}