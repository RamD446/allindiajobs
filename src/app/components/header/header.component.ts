import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../../config/firebase.config';
import {
  CATEGORY_ROUTE_PREFIX, GOVERNMENT_JOB_FILTERS, PRIVATE_JOB_FILTERS,
  PRIVATE_HIRING_FILTERS, PRIVATE_EXPERIENCE_FILTERS
} from '../../models/job.model';

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
  userEmail = '';
  profileOpen = false;
  private stopAuth: (() => void) | null = null;
  readonly categoryRoutePrefix = CATEGORY_ROUTE_PREFIX;

  governmentOpen = false;
  privateOpen = false;
  readonly governmentJobFilters = GOVERNMENT_JOB_FILTERS;
  readonly privateJobFilters = PRIVATE_JOB_FILTERS;
  readonly privateHiringFilters = PRIVATE_HIRING_FILTERS;
  readonly privateExperienceFilters = PRIVATE_EXPERIENCE_FILTERS;

  constructor(private router: Router, private cdr: ChangeDetectorRef, private hostElement: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.stopAuth = onAuthStateChanged(auth, (user) => {
      this.isSignedIn = Boolean(user);
      this.userEmail = user?.email || '';
      if (!user) this.profileOpen = false;
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
    this.profileOpen = false;
  }

  toggleCategories(): void {
    this.categoriesOpen = !this.categoriesOpen;
    this.searchOpen = false;
    this.profileOpen = false;
  }

  toggleProfile(): void {
    if (!this.isSignedIn) return;
    this.profileOpen = !this.profileOpen;
    this.searchOpen = false;
    this.categoriesOpen = false;
  }

  async signOutFromHeader(): Promise<void> {
    this.closeMenus();
    await signOut(auth);
  }

  submitSearch(): void {
    const query = this.searchQuery.trim();
    void this.router.navigate(['/'], { queryParams: { q: query || null } });
    this.searchOpen = false;
  }

  closeMenus(): void {
    this.searchOpen = false;
    this.categoriesOpen = false;
    this.profileOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenus();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.profileOpen && !this.hostElement.nativeElement.contains(event.target as Node)) {
      this.profileOpen = false;
    }
  }
}