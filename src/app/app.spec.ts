import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { By } from '@angular/platform-browser';
import { HeaderComponent } from './components/header/header.component';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the shared site shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-layout')).toBeTruthy();
  });

  it('includes every expanded menu link in the footer Quick links', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const headerElement = fixture.debugElement.query(By.directive(HeaderComponent));
    const header: HeaderComponent = headerElement.componentInstance;
    header.categoriesOpen = true;
    header.governmentOpen = true;
    header.experienceOpen = true;
    headerElement.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    const menuLinks = [...compiled.querySelectorAll('.category-drawer nav a')]
      .map((link) => link.getAttribute('href'));
    const footerLinks = [...compiled.querySelectorAll('.footer-quick-links a')]
      .map((link) => link.getAttribute('href'));
    expect(menuLinks.length).toBeGreaterThan(2);
    expect(footerLinks).toEqual(expect.arrayContaining(menuLinks));
    const footerGroups = [...compiled.querySelectorAll('.footer-category-group')];
    expect(footerGroups.map((group) => group.querySelector('summary span')?.textContent))
      .toEqual(['All government jobs', 'Fresher & experienced jobs']);
    expect(footerGroups.map((group) => group.querySelectorAll('a').length)).toEqual([4, 3]);
    expect(compiled.querySelector('.footer-quick-links > a')?.textContent).toBe('All latest notifications');
    expect(compiled.querySelector('.footer-quick-links a[href="/jobcategories/walk-ins"]')?.textContent).toBe('All walk-in jobs');
  });
});
