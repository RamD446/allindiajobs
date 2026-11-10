import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { JOB_ICONS, Job } from '../../models/job.model';
import { HomeComponent } from './home.component';

describe('HomeComponent job icons', () => {
  const component = new HomeComponent({} as Router, {} as ActivatedRoute, {} as ChangeDetectorRef);
  const job = {
    id: 'test',
    title: 'Test job',
    company: 'Test company',
    description: '',
    createdDate: '2026-01-01'
  } satisfies Job;

  it('offers 20 distinct icons', () => {
    expect(JOB_ICONS.length).toBe(20);
    expect(new Set(JOB_ICONS).size).toBe(20);
  });

  it('resolves a selected icon without changing legacy image fallback', () => {
    expect(component.getJobIcon({ ...job, jobIcon: JOB_ICONS[3] })).toBe(JOB_ICONS[3]);
    expect(component.getJobIcon(job)).toBe('');
    expect(component.getJobIcon({ ...job, jobIcon: 'bi-invalid' })).toBe('');
    expect(component.getJobCardImage(job)).toBe(component.defaultJobImage);
  });

  it('does not append Jobs to non-job category headings', () => {
    for (const category of ['Results', 'Career Tips', 'Syllabus']) {
      component.selectedJobCategory = category;
      expect(component.getLatestJobsHeading()).toBe(`All Latest ${category}`);
    }
    component.selectedJobCategory = 'Government Jobs';
    expect(component.getLatestJobsHeading()).toBe('All Latest Government Jobs');
    component.selectedJobCategory = 'All';
    expect(component.getLatestJobsHeading()).toBe('All Latest Jobs');
  });

  it('filters listings by job type and company while keeping filter choices available', () => {
    component.walkinJobs = [
      { ...job, id: 'walkin', jobType: 'Walk-ins', company: 'Acme' },
      { ...job, id: 'government', jobType: 'Government Jobs', company: 'Gov Office' },
      { ...job, id: 'another-walkin', jobType: 'Walk-ins', company: 'Other Co' }
    ];
    component.selectedJobCategory = 'All';
    component.selectedJobTypeFilter = 'Walk-ins';
    component.selectedCompanyFilter = 'Acme';

    expect(component.getSidebarJobTypes()).toEqual(['Government Jobs', 'Walk-ins']);
    expect(component.getSidebarCompanies().sort()).toEqual(['Acme', 'Other Co']);
    expect(component.getFilteredJobsForHome().map(item => item.id)).toEqual(['walkin']);
    component.selectedJobTypeFilter = '';
    component.selectedCompanyFilter = '';
    component.walkinJobs = [];
  });

  it('updates the URL filters and resets pagination', () => {
    const calls: Array<{ commands: unknown[]; extras?: NavigationExtras }> = [];
    const router = {
      navigate: (commands: unknown[], extras?: NavigationExtras) => {
        calls.push({ commands, extras });
        return Promise.resolve(true);
      }
    } as Router;
    const route = {} as ActivatedRoute;
    const filters = new HomeComponent(router, route, {} as ChangeDetectorRef);
    filters.currentPage = 3;
    filters.selectedCompanyFilter = 'Acme';

    filters.filterByJobType('Walk-ins');
    expect(filters.currentPage).toBe(1);
    expect(calls[0]).toEqual({
      commands: ['/'],
      extras: { queryParams: { jobType: 'Walk-ins', company: 'Acme' } }
    });

    filters.currentPage = 2;
    filters.filterByCompany('Other Co');
    expect(filters.currentPage).toBe(1);
    expect(calls[1]).toEqual({
      commands: [],
      extras: { relativeTo: route, queryParams: { company: 'Other Co' }, queryParamsHandling: 'merge' }
    });
  });

  it('shows at most 50 stable, randomly sampled companies and retains a selected company', () => {
    const filters = new HomeComponent({} as Router, {} as ActivatedRoute, {} as ChangeDetectorRef);
    filters.walkinJobs = Array.from({ length: 75 }, (_, i) => ({
      ...job,
      id: `${i}`,
      company: `Company ${String(i).padStart(2, '0')}`
    }));

    const sample = filters.getSidebarCompanies();
    expect(sample).toHaveLength(50);
    expect(new Set(sample).size).toBe(50);
    expect(filters.getSidebarCompanies()).toEqual(sample);

    const missing = filters.walkinJobs.find(item => !sample.includes(item.company))!.company;
    filters.selectedCompanyFilter = missing;
    const withSelected = filters.getSidebarCompanies();
    expect(withSelected).toHaveLength(50);
    expect(withSelected[0]).toBe(missing);
    expect(filters.getFilteredJobsForHome()).toHaveLength(1);
    expect(filters.getSidebarCompanies()).toEqual(withSelected);
  });
});
