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

  it('shows the new menu and expands experience links, closing the drawer on selection', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentInstance.toggleCategories();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect([...element.querySelectorAll('.category-drawer nav > a, .category-drawer nav > button')]
      .map((item) => item.textContent?.trim())).toEqual([
      'All latest notifications', 'All government jobs', 'Fresher & experienced jobs',
      'All walk-in jobs', 'Official Career Links'
    ]);
    expect(element.querySelector('#private-job-menu')).toBeNull();
    const button = element.querySelector<HTMLButtonElement>('[aria-controls="experience-job-menu"]')!;
    expect(element.querySelector('#experience-job-menu')).toBeNull();
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect([...element.querySelectorAll('#experience-job-menu a')].map((link) => ({
      text: link.textContent?.trim(), href: link.getAttribute('href')
    }))).toEqual([
      { text: 'Fresher', href: '/jobcategories/private-freshers' },
      { text: 'Experienced', href: '/jobcategories/private-experienced' },
      { text: 'Fresher & Experienced', href: '/jobcategories/private-freshers-experienced' }
    ]);
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('#experience-job-menu')).toBeNull();
    button.click();
    fixture.detectChanges();
    element.querySelector<HTMLAnchorElement>('#experience-job-menu a:last-child')!.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/jobcategories/private-freshers-experienced');
    expect(fixture.componentInstance.categoriesOpen).toBe(false);
  });
});
