import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { HeaderComponent } from './header.component';

@Component({ template: '' })
class CategoryPage {}

describe('Header category menu', () => {
  beforeEach(async () => {
    vi.spyOn(HeaderComponent.prototype, 'ngOnInit').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([
        { path: '', component: CategoryPage },
        { path: 'jobcategories/:category', component: CategoryPage }
      ])]
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  it('expands and collapses the four government job type links', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentInstance.toggleCategories();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const button = element.querySelectorAll<HTMLButtonElement>('.category-group-toggle')[0];
    expect(element.querySelector('#government-job-menu')).toBeNull();
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect([...element.querySelectorAll('#government-job-menu a')].map((link) => ({
      text: link.textContent?.trim(), href: link.getAttribute('href')
    }))).toEqual([
      { text: 'Current jobs', href: '/jobcategories/current-jobs' },
      { text: 'Upcoming jobs', href: '/jobcategories/upcoming-jobs' },
      { text: 'Results', href: '/jobcategories/results' },
      { text: 'Syllabus', href: '/jobcategories/syllabus' }
    ]);
    button.click();
    fixture.detectChanges();
    expect(element.querySelector('#government-job-menu')).toBeNull();
  });

  it('shows private options and navigates to the selected option, closing the menu', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentInstance.toggleCategories();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelectorAll<HTMLButtonElement>('.category-group-toggle')[1].click();
    fixture.detectChanges();
    const links = [...element.querySelectorAll<HTMLAnchorElement>('#private-job-menu a')];
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'All private jobs', 'IT Jobs', 'Non-IT Jobs', 'Pharma Jobs', 'Sales Jobs',
      'Pharmaceutical Jobs', 'Bank Jobs', 'Other', 'Walk-in', 'Non-walk-in', 'Fresher', 'Experienced'
    ]);
    links.find((link) => link.textContent?.trim() === 'Non-walk-in')?.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/jobcategories/non-walk-in');
    expect(fixture.componentInstance.categoriesOpen).toBe(false);
  });
});
