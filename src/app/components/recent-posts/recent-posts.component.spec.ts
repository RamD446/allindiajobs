import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Job } from '../../models/job.model';
import { RecentPostsComponent } from './recent-posts.component';

describe('RecentPostsComponent', () => {
  let fixture: ComponentFixture<RecentPostsComponent>;
  const job: Job = {
    id: 'test',
    title: 'Test opening',
    company: 'Test company',
    description: '',
    createdDate: '2026-01-01'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RecentPostsComponent] }).compileComponents();
    fixture = TestBed.createComponent(RecentPostsComponent);
    fixture.componentInstance.jobs = [job];
  });

  it('renders a clickable modern job card on the home page', () => {
    fixture.componentInstance.modern = true;
    const selected: Job[] = [];
    fixture.componentInstance.jobSelected.subscribe(value => selected.push(value));
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.modern-recent-item');
    expect(button.textContent).toContain(job.title);
    button.click();
    expect(selected).toEqual([job]);
  });

  it('keeps the existing table display for job details', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.recent-post-table')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.modern-recent-item')).toBeNull();
  });
});
