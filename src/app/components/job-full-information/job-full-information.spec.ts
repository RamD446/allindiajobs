import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobFullInformation } from './job-full-information';

describe('JobFullInformation', () => {
  let component: JobFullInformation;
  let fixture: ComponentFixture<JobFullInformation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobFullInformation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobFullInformation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
