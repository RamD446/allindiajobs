import { TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { routes } from '../../app.routes';
import { Job } from '../../models/job.model';
import { HomeComponent } from './home.component';

vi.mock('firebase/database', () => ({
  getDatabase: () => ({}),
  ref: () => ({}),
  get: async () => ({ val: () => null }),
  onValue: () => () => {}
}));

const governmentJob: Job = {
  id: 'government', company: 'Bank', title: 'Analyst', sector: 'Government',
  jobType: 'Government Jobs', description: '', createdDate: '2026-11-17'
};
const privateJob: Job = {
  id: 'private', company: 'Tech', title: 'Engineer', sector: 'Private',
  jobType: 'IT Jobs', privateJobType: 'Walk-in', experience: 'Freshers', description: '', createdDate: '2026-11-17'
};

describe('Home category routes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: [provideRouter(routes)] }).compileComponents();
  });

  it('loads categories from their URL and retains old query filter links', async () => {
    const harness = await RouterTestingHarness.create();
    for (const [url, expectedIds] of [
      ['/jobcategories/government-jobs', ['government']],
      ['/jobcategories/walk-ins', ['private']],
      ['/jobcategories/freshers', ['private']],
      ['/?category=government', ['government']]
    ] as const) {
      const component = await harness.navigateByUrl(url, HomeComponent);
      component.jobs = [governmentJob, privateJob];
      harness.routeDebugElement?.injector.get(ChangeDetectorRef).markForCheck();
      harness.detectChanges();
      expect(component.filteredJobs.map((job) => job.id)).toEqual([...expectedIds]);
    }
  });

  it('navigates to category paths and back to all jobs while preserving search', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/?q=Analyst', HomeComponent);
    component.selectFilter('Government Jobs');
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/jobcategories/government-jobs?q=Analyst');
    const filtered = await harness.navigateByUrl('/jobcategories/government-jobs?q=Analyst', HomeComponent);
    expect(filtered.filter).toBe('Government Jobs');
    expect(filtered.appliedQuery).toBe('Analyst');
    filtered.selectFilter('All jobs');
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/?q=Analyst');
  });

  it('shows Top 6 only on the unfiltered home page and hides them for category or search', async () => {
    const harness = await RouterTestingHarness.create();
    for (const [url, visible] of [
      ['/', true],
      ['/jobcategories/walk-ins', false],
      ['/?q=Bank', false],
      ['/?category=government', false],
      ['/', true]
    ] as const) {
      const component = await harness.navigateByUrl(url, HomeComponent);
      component.jobs = [governmentJob, privateJob];
      component.topJobs = [governmentJob];
      component.loading = false;
      harness.routeDebugElement?.injector.get(ChangeDetectorRef).markForCheck();
      harness.detectChanges();
      expect(Boolean(harness.routeNativeElement?.querySelector('.top-jobs-section'))).toBe(visible);
    }
  });

  it('filters government types and private type, hiring and experience links independently', async () => {
    const harness = await RouterTestingHarness.create();
    const jobs: Job[] = [
      { ...governmentJob, experience: 'Freshers, Experienced' },
      { ...governmentJob, id: 'upcoming', sector: undefined, jobType: 'Upcoming Jobs' },
      { ...governmentJob, id: 'results', jobType: 'Results' },
      { ...governmentJob, id: 'syllabus', sector: undefined, jobType: 'Syllabus' },
      privateJob,
      { ...privateJob, id: 'non-walk-in', sector: undefined, privateJobType: 'Non-walk-in', experience: 'Experienced' },
      { ...privateJob, id: 'no-hiring-type', jobType: 'Bank Jobs', privateJobType: null, experience: '' }
    ];
    for (const [slug, ids] of [
      ['current-jobs', ['government']],
      ['upcoming-jobs', ['upcoming']],
      ['results', ['results']],
      ['syllabus', ['syllabus']],
      ['it-jobs', ['private', 'non-walk-in']],
      ['bank-jobs', ['no-hiring-type']],
      ['private-walk-ins', ['private']],
      ['non-walk-in', ['non-walk-in']],
      ['private-freshers', ['private']],
      ['private-experienced', ['non-walk-in']],
      ['private-jobs', ['private', 'non-walk-in', 'no-hiring-type']]
    ] as const) {
      const component = await harness.navigateByUrl(`/jobcategories/${slug}`, HomeComponent);
      component.jobs = jobs;
      harness.routeDebugElement?.injector.get(ChangeDetectorRef).markForCheck();
      harness.detectChanges();
      expect(component.filteredJobs.map((job) => job.id), slug).toEqual([...ids]);
    }
  });
});
