import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { JobFullInformation } from './job-full-information';

describe('Job detail video', () => {
  beforeEach(async () => {
    vi.spyOn(JobFullInformation.prototype, 'ngOnInit').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [JobFullInformation], providers: [provideRouter([])]
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  it('links to the latest other job above the full information when available', () => {
    const fixture = TestBed.createComponent(JobFullInformation);
    const component = fixture.componentInstance;
    component.loading = false;
    component.job = {
      id: 'current', title: 'Current job', company: 'Bank', description: '', createdDate: '',
      fullJobInformation: 'More details'
    };
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.notification-heading')).toBeNull();

    component.recentJobs = [
      { id: 'current', title: 'Current job', company: 'Bank', description: '', createdDate: '' },
      { id: 'duplicate', title: '  CURRENT JOB  ', company: 'Bank', description: '', createdDate: '' },
      { id: 'latest', title: 'Latest opening', company: 'Bank', description: '', createdDate: '' },
      { id: 'older', title: 'Older opening', company: 'Bank', description: '', createdDate: '' }
    ];
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    const heading = element.querySelector('.notification-heading');
    expect(heading?.textContent?.trim()).toBe('Read also: Latest opening');
    expect(heading?.querySelector('a')?.textContent?.trim()).toBe('Read also: Latest opening');
    expect(heading?.querySelector('a')?.getAttribute('href')).toBe('/job/latest/latest-opening');
    expect(heading?.nextElementSibling?.querySelector('.eyebrow')?.textContent).toBe('MORE INFORMATION:');
    component.job.fullJobInformation = '';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(element.querySelector('.notification-heading a')?.textContent).toBe('Read also: Latest opening');
    component.recentJobs = component.recentJobs.slice(0, 2);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(element.querySelector('.notification-heading')).toBeNull();
  });

  it('renders formatted full job information', () => {
    const fixture = TestBed.createComponent(JobFullInformation);
    const component = fixture.componentInstance;
    component.loading = false;
    component.job = {
      id: 'formatted-job', title: 'Analyst', company: 'Bank', description: '', createdDate: '',
      fullJobInformation: '<p>Read the <strong>full notification</strong>.</p>'
    };
    fixture.detectChanges();

    const notification = [...fixture.nativeElement.querySelectorAll('.detail-section')]
      .find((section: Element) => section.querySelector('.eyebrow')?.textContent?.includes('MORE INFORMATION'))
      ?.querySelector('.rich-text');
    expect(notification.querySelector('strong')?.textContent).toBe('full notification');
  });

  it('renders all three important links below the full information', () => {
    const fixture = TestBed.createComponent(JobFullInformation);
    const component = fixture.componentInstance;
    component.loading = false;
    component.job = {
      id: 'links-job', title: 'Analyst', company: 'Bank', description: '', createdDate: '',
      fullJobInformation: 'More details',
      companyOfficialUrl: 'https://bank.test/careers',
      otherLink: 'https://bank.test/apply',
      applyPdfLink: 'https://bank.test/notice.pdf'
    };
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const moreInformation = [...element.querySelectorAll('.detail-section')]
      .find((section) => section.textContent?.includes('MORE INFORMATION'));
    const linksSection = element.querySelector('.important-links-section');
    expect(moreInformation?.nextElementSibling).toBe(linksSection);
    const table = element.querySelector('.important-links-table');
    expect(table?.querySelector('thead tr:first-child th')?.textContent?.trim()).toBe('IMPORTANT LINKS');
    expect(table?.querySelectorAll('thead tr').length).toBe(1);
    expect([...table!.querySelectorAll('tbody th')].map((cell) => cell.textContent?.trim()))
      .toEqual(['Official URL', 'Apply URL', 'PDF URL']);
    expect([...table!.querySelectorAll('tbody a')].map((link) => link.getAttribute('href')))
      .toEqual(['https://bank.test/careers', 'https://bank.test/apply', 'https://bank.test/notice.pdf']);
  });

  it('renders the saved video and removes the player when no video is set', () => {
    const fixture = TestBed.createComponent(JobFullInformation);
    const component = fixture.componentInstance;
    component.loading = false;
    component.job = {
      id: 'job', title: 'Analyst', company: 'Bank', description: '', createdDate: '',
      youtubeUrl: 'https://www.youtube.com/watch?v=8Tr_JiktpBk&list=playlist&index=2'
    };
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('iframe')?.getAttribute('src'))
      .toBe('https://www.youtube-nocookie.com/embed/8Tr_JiktpBk');
    expect(element.querySelector('.video-help a')?.getAttribute('href'))
      .toBe('https://www.youtube.com/watch?v=8Tr_JiktpBk');
    component.job.youtubeUrl = '';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(element.querySelector('iframe')).toBeNull();
    expect(element.querySelector('.video-help a')).toBeNull();
    component.job.youtubeUrl = 'https://example.test/video';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(element.querySelector('iframe')).toBeNull();
    expect(element.textContent).toContain("This job's video link is invalid.");
  });
});
