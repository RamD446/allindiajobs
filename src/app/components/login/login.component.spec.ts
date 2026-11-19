import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import * as database from 'firebase/database';
import { LoginComponent } from './login.component';

vi.mock('firebase/database', () => ({
  getDatabase: () => ({}),
  ref: () => ({}),
  push: () => ({ key: 'new-job' }),
  onValue: () => () => {},
  remove: async () => {},
  set: async () => {},
  update: async () => {}
}));

describe('LoginComponent job editor', () => {
  beforeEach(async () => {
    vi.spyOn(LoginComponent.prototype, 'ngOnInit').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  async function createEditor() {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.authLoading = false;
    component.user = {
      uid: 'publisher', email: 'publisher@example.test', emailVerified: true,
      isAnonymous: false, metadata: {}, providerData: [], refreshToken: '',
      tenantId: null, displayName: null, phoneNumber: null, photoURL: null,
      providerId: 'firebase', delete: vi.fn(), getIdToken: vi.fn(),
      getIdTokenResult: vi.fn(), reload: vi.fn(), toJSON: vi.fn()
    };
    component.startCreate();
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  async function createJobList(count: number) {
    const fixture = await createEditor();
    fixture.componentInstance.closeForm();
    fixture.componentInstance.jobs = Array.from({ length: count }, (_, index) => ({
      id: `job-${index + 1}`, title: `Role ${index + 1}`, company: 'Employer',
      description: '', createdDate: '2026-01-01', jobType: index < 50 ? 'Government Jobs' : 'IT Jobs'
    }));
    fixture.detectChanges();
    return fixture;
  }

  it('paginates published jobs in groups of 50 with bounded navigation', async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const fixture = await createJobList(101);
    const element: HTMLElement = fixture.nativeElement;
    const previous = element.querySelector<HTMLButtonElement>('.admin-pagination button:first-child')!;
    const next = element.querySelector<HTMLButtonElement>('.admin-pagination button:last-child')!;
    expect(element.querySelectorAll('.admin-job-row')).toHaveLength(50);
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    next.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.admin-job-row')).toHaveLength(50);
    expect(element.querySelector('.admin-job-info strong')?.textContent).toBe('Role 51');

    next.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.admin-job-row')).toHaveLength(1);
    expect(element.querySelector('.admin-job-info strong')?.textContent).toBe('Role 101');
    expect(element.querySelector('.admin-pagination span')?.textContent).toBe('Page 3 of 3');
    expect(next.disabled).toBe(true);
    expect(previous.disabled).toBe(false);

    previous.click();
    fixture.detectChanges();
    expect(element.querySelector('.admin-job-info strong')?.textContent).toBe('Role 51');
  });

  it('resets pagination when searching or filtering and handles 50 or zero matches', async () => {
    const fixture = await createJobList(101);
    const component = fixture.componentInstance;
    const element: HTMLElement = fixture.nativeElement;
    const search = element.querySelector<HTMLInputElement>('#admin-search')!;
    const filter = element.querySelector<HTMLSelectElement>('#admin-type')!;
    component.page = 3;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    search.value = 'Role 101';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.page).toBe(1);
    expect(element.querySelectorAll('.admin-job-row')).toHaveLength(1);
    expect(element.querySelector('.admin-pagination')).toBeNull();

    search.value = '';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    component.page = 2;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    filter.value = 'Government Jobs';
    filter.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.page).toBe(1);
    expect(element.querySelectorAll('.admin-job-row')).toHaveLength(50);
    expect(element.querySelector('.admin-pagination')).toBeNull();

    search.value = 'No matching role';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelectorAll('.admin-job-row')).toHaveLength(0);
    expect(element.querySelector('.admin-pagination')).toBeNull();
    expect(element.querySelector('.state-panel')?.textContent).toBe('No jobs match this view.');
  });

  it.each([false, true])('keeps a valid page when the last job is deleted (failure: %s)', async (fails) => {
    const fixture = await createJobList(51);
    const component = fixture.componentInstance;
    component.page = 2;
    if (fails) vi.spyOn(database, 'remove').mockRejectedValueOnce(new Error('Permission denied'));
    component.requestDelete(component.jobs[50]);

    await component.confirmDelete();
    fixture.detectChanges();

    expect(component.page).toBe(fails ? 2 : 1);
    expect(fixture.nativeElement.querySelectorAll('.admin-job-row')).toHaveLength(fails ? 1 : 50);
    expect(component.noticeType).toBe(fails ? 'error' : 'success');
  });

  it('only shows private hiring choices for the Private sector', async () => {
    const fixture = await createEditor();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('input[name="privateJobType"]').length).toBe(0);

    fixture.componentInstance.draft.sector = 'Private';
    fixture.componentInstance.onSectorChange();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelectorAll('input[name="privateJobType"]').length).toBe(2);
    expect(element.querySelector('input[name="privateJobType"]:checked')).toBeNull();

    fixture.componentInstance.draft.sector = 'Government';
    fixture.componentInstance.onSectorChange();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelectorAll('input[name="privateJobType"]').length).toBe(0);
  });

  it('uses the rich-text editor for full notification', async () => {
    const fixture = await createEditor();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('app-tiptap-editor[name="fullJobInformation"]')).not.toBeNull();
    expect(element.querySelector('textarea[name="fullJobInformation"]')).toBeNull();
  });

  it('does not open the image picker when clicking the notification editor', async () => {
    const fixture = await createEditor();
    const element: HTMLElement = fixture.nativeElement;
    const imageInput = element.querySelector<HTMLInputElement>('app-tiptap-editor input[type="file"]')!;
    const imageClick = vi.fn();
    imageInput.addEventListener('click', imageClick);

    element.querySelector<HTMLElement>('app-tiptap-editor .tiptap-editor')!.click();

    expect(imageClick).not.toHaveBeenCalled();
  });

  it('filters visible career company suggestions and preserves unlisted names when editing', async () => {
    const fixture = await createEditor();
    const component = fixture.componentInstance;
    component.careerLinks = [
      { id: 'career-1', companyName: 'Example Company', officialUrl: 'https://example.test', sector: 'Private' },
      { id: 'career-2', companyName: 'Example Company', officialUrl: 'https://example.test/jobs', sector: 'Private' },
      { id: 'career-3', companyName: 'Other Company', officialUrl: 'https://other.test', sector: 'Private' }
    ];
    fixture.detectChanges();

    const companyInput = fixture.nativeElement.querySelector('input[name="company"]') as HTMLInputElement;
    companyInput.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect([...fixture.nativeElement.querySelectorAll('.company-suggestion')].map((option: Element) => option.textContent?.trim()))
      .toEqual(['Example Company', 'Other Company']);

    companyInput.value = 'Other';
    companyInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect([...fixture.nativeElement.querySelectorAll('.company-suggestion')].map((option: Element) => option.textContent?.trim()))
      .toEqual(['Other Company']);
    (fixture.nativeElement.querySelector('.company-suggestion') as HTMLButtonElement).click();
    expect(component.draft.company).toBe('Other Company');
    expect(component.draft.companyOfficialUrl).toBe('https://other.test');
    expect(component.companySearchOpen).toBe(false);

    component.startEdit({ ...component.draft, id: 'legacy-job', company: 'Legacy Company' });
    expect(component.companyOptions).toContain('Legacy Company');
    expect(component.draft.company).toBe('Legacy Company');
  });

  it('offers upcoming government jobs and preserves them when editing', async () => {
    const fixture = await createEditor();
    const element: HTMLElement = fixture.nativeElement;
    const choices = [...element.querySelectorAll('input[name="jobType"]')];
    expect(choices.map((input) => input.parentElement?.textContent?.trim()))
      .toEqual(['Current jobs', 'Upcoming jobs', 'Results', 'Syllabus']);
    const upcoming = [...element.querySelectorAll<HTMLInputElement>('input[name="jobType"]')]
      .find((input) => input.parentElement?.textContent?.trim() === 'Upcoming jobs');
    expect(upcoming).toBeDefined();
    upcoming?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.draft.jobType).toBe('Upcoming Jobs');

    fixture.componentInstance.startEdit({ ...fixture.componentInstance.draft, id: 'upcoming-job' });
    expect(fixture.componentInstance.draft.sector).toBe('Government');
    expect(fixture.componentInstance.draft.jobType).toBe('Upcoming Jobs');
  });

  it('prefills the author and saves the default when the field is cleared', async () => {
    const fixture = await createEditor();
    const component = fixture.componentInstance;
    expect(component.draft.createdBy).toBe('Freejobinfoartmation -team');
    component.draft.title = 'New role';
    component.draft.company = 'Employer';
    component.draft.createdBy = '   ';
    const save = vi.spyOn(database, 'set');

    await component.saveJob();

    expect(save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      createdBy: 'Freejobinfoartmation -team'
    }));
  });

  it('preserves a custom author when publishing', async () => {
    const fixture = await createEditor();
    const component = fixture.componentInstance;
    component.draft.title = 'New role';
    component.draft.company = 'Employer';
    component.draft.createdBy = 'Custom publisher';
    const save = vi.spyOn(database, 'set');

    await component.saveJob();

    expect(save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      createdBy: 'Custom publisher'
    }));
  });

  it('saves the official, apply, and PDF URLs with the job', async () => {
    const fixture = await createEditor();
    const component = fixture.componentInstance;
    component.draft.title = 'New role';
    component.draft.company = 'Employer';
    component.draft.companyOfficialUrl = 'https://employer.test/careers';
    component.draft.otherLink = 'https://employer.test/apply';
    component.draft.applyPdfLink = 'https://employer.test/notice.pdf';
    const save = vi.spyOn(database, 'set');

    await component.saveJob();

    expect(save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      companyOfficialUrl: 'https://employer.test/careers',
      otherLink: 'https://employer.test/apply',
      applyPdfLink: 'https://employer.test/notice.pdf'
    }));
  });

  it('does not silently select Non-walk-in when saving or reopening an unselected job', async () => {
    const fixture = await createEditor();
    const component = fixture.componentInstance;
    component.draft.sector = 'Private';
    component.onSectorChange();
    component.draft.title = 'New role';
    component.draft.company = 'Employer';
    const save = vi.spyOn(database, 'set');

    await component.saveJob();

    expect(save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      privateJobType: null, walkInDrive: false, walkInDate: ''
    }));
    component.startEdit(component.jobs[0]);
    expect(component.draft.privateJobType).toBeNull();
  });

  it('retains explicit hiring choices and resets them when switching sectors', async () => {
    const fixture = await createEditor();
    const component = fixture.componentInstance;
    for (const privateJobType of ['Walk-in', 'Non-walk-in'] as const) {
      component.startEdit({ ...component.draft, sector: 'Private', privateJobType });
      expect(component.draft.privateJobType).toBe(privateJobType);
    }
    component.draft.sector = 'Government';
    component.onSectorChange();
    component.draft.sector = 'Private';
    component.onSectorChange();
    expect(component.draft.privateJobType).toBeNull();
  });

  it('leaves the video empty by default and preserves a supplied video through save and edit', async () => {
    const fixture = await createEditor();
    const component = fixture.componentInstance;
    expect(component.draft.youtubeUrl).toBe('');
    component.draft.title = 'New role';
    component.draft.company = 'Employer';
    const youtubeUrl = 'https://www.youtube.com/watch?v=8Tr_JiktpBk&list=PLVlQHNRLflP-jc5Fbhfdhzv52AWYq836j&index=2';
    component.draft.youtubeUrl = youtubeUrl;
    const save = vi.spyOn(database, 'set');
    await component.saveJob();
    expect(save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ youtubeUrl }));
    component.startEdit(component.jobs[0]);
    expect(component.draft.youtubeUrl).toBe(youtubeUrl);
  });

  it('rejects invalid video URLs without publishing', async () => {
    const fixture = await createEditor();
    const component = fixture.componentInstance;
    component.draft.title = 'New role';
    component.draft.youtubeUrl = 'https://example.test/video';
    const save = vi.spyOn(database, 'set');
    await component.saveJob();
    expect(save).not.toHaveBeenCalled();
    expect(component.noticeType).toBe('error');
    expect(component.notice).toContain('valid YouTube video URL');
    expect(component.formOpen).toBe(true);
  });
});
