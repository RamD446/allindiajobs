import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { onValue, ref } from 'firebase/database';
import { db } from '../../../config/firebase.config';

interface CareerLink {
  id: string;
  companyName: string;
  officialUrl: string;
  sector?: 'Government' | 'Private';
}

@Component({
  selector: 'app-career-links',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './career-links.component.html',
  styleUrl: './career-links.component.css'
})
export class CareerLinksComponent implements OnInit, OnDestroy {
  governmentLinks: CareerLink[] = [];
  privateLinks: CareerLink[] = [];
  loading = true;
  error = '';
  private stopLinks: (() => void) | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.stopLinks = onValue(ref(db, 'careerLinks'), (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<CareerLink, 'id'>> | null;
      const links = data ? Object.entries(data).map(([id, link]) => ({ id, ...link })) : [];
      links.sort((first, second) => first.companyName.localeCompare(second.companyName));
      this.governmentLinks = links.filter((link) => link.sector !== 'Private');
      this.privateLinks = links.filter((link) => link.sector === 'Private');
      this.loading = false;
      this.error = '';
      this.cdr.detectChanges();
    }, () => {
      this.loading = false;
      this.error = 'Career links are unavailable right now. Please try again later.';
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.stopLinks?.();
  }
}