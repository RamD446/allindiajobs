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
});
