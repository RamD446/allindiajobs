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
    expect(heading?.querySelector('a')?.getAttribute('href')).toBe('/job/latest/latest-opening');
    expect(heading?.nextElementSibling?.querySelector('.eyebrow')?.textContent).toBe('MORE INFORMATION');
    component.job.fullJobInformation = '';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(element.querySelector('.notification-heading a')?.textContent).toBe('Latest opening');
    component.recentJobs = component.recentJobs.slice(0, 2);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(element.querySelector('.notification-heading')).toBeNull();
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
