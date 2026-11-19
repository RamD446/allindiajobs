import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { FooterComponent } from './footer.component';

@Component({ template: '' })
class FooterDestination {}

describe('Footer navigation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([
        { path: '', component: FooterDestination },
        { path: 'jobcategories/:category', component: FooterDestination },
        { path: 'official-career-links', component: FooterDestination },
        { path: 'login', component: FooterDestination }
      ])]
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  it('navigates and scrolls to the top for every internal footer link, including the current page', async () => {
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');

    for (const link of element.querySelectorAll<HTMLAnchorElement>('a:not([target])')) {
      scroll.mockClear();
      link.click();
      await fixture.whenStable();
      expect(router.url).toBe(link.getAttribute('href'));
      expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    }
  });

  it('does not scroll the current page when a link is opened in another tab', () => {
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.footer-quick-links > a');
    link.addEventListener('click', (event) => event.preventDefault());

    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));

    expect(scroll).not.toHaveBeenCalled();
  });
});
