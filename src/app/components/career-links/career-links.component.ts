import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { onValue, ref } from 'firebase/database';
import { db } from '../../../config/firebase.config';

interface CareerLink {
  id: string;
  companyName: string;
  officialUrl: string;
  sector?: 'Government' | 'Private';
  governmentType?: string;
  state?: string;
}

@Component({
  selector: 'app-career-links',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './career-links.component.html',
  styleUrl: './career-links.component.css'
})
export class CareerLinksComponent implements OnInit, OnDestroy {
  governmentLinks: CareerLink[] = [];
  privateLinks: CareerLink[] = [];
  searchQuery = '';
  sectorFilter: 'All' | 'Government' | 'Private' = 'All';
  loading = true;
  error = '';
  private stopLinks: (() => void) | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  get filteredLinks(): CareerLink[] {
    return this.filterLinks([...this.governmentLinks, ...this.privateLinks])
      .sort((first, second) => {
        const sectorOrder = this.sectorOrder(first) - this.sectorOrder(second);
        if (sectorOrder) return sectorOrder;
        const governmentTypeOrder = this.governmentTypeOrder(first) - this.governmentTypeOrder(second);
        if (governmentTypeOrder) return governmentTypeOrder;
        const stateOrder = (first.state || '').localeCompare(second.state || '', undefined, { sensitivity: 'base' });
        return stateOrder || first.companyName.localeCompare(second.companyName);
      });
  }

  get filteredLinkCount(): number {
    return this.filteredLinks.length;
  }

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

  private filterLinks(links: CareerLink[]): CareerLink[] {
    const query = this.searchQuery.trim().toLowerCase();
    return links.filter((link) => [
      link.companyName, link.officialUrl, link.sector || 'Government', link.governmentType || '', link.state || ''
    ].some((value) => value.toLowerCase().includes(query)) &&
      (this.sectorFilter === 'All' || (link.sector || 'Government') === this.sectorFilter));
  }

  private sectorOrder(link: CareerLink): number {
    return (link.sector || 'Government') === 'Government' ? 0 : 1;
  }

  private governmentTypeOrder(link: CareerLink): number {
    const type = (link.governmentType || '').toLowerCase();
    if (type.includes('all india')) return 0;
    if (type.includes('central')) return 1;
    if (type.includes('state')) return 2;
    return 3;
  }
}