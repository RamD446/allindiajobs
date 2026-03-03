import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { onValue, ref } from 'firebase/database';
import { db } from '../../../config/firebase.config';
import { JobCareer, CAREER_JOB_TYPES } from '../../models/job.model';

@Component({
  selector: 'app-official-company-careers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './official-company-careers.component.html',
  styleUrl: './official-company-careers.component.css'
})
export class OfficialCompanyCareersComponent implements OnInit {
  jobCareers: JobCareer[] = [];
  careerJobTypes: string[] = [...CAREER_JOB_TYPES];
  isLoading: boolean = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadJobCareers();
  }

  loadJobCareers() {
    this.isLoading = true;
    try {
      const careersRef = ref(db, 'jobCareers');
      onValue(careersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.jobCareers = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }, (error) => {
        console.error('Firebase error:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error loading careers:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  getCareersByType(type: string): JobCareer[] {
    return this.jobCareers.filter(career => career.jobType === type);
  }
}
