import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { db } from '../../config/firebase.config';
import { Job, DEFAULT_JOB_CATEGORIES } from '../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private jobsSubject = new BehaviorSubject<Job[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private categoriesSubject = new BehaviorSubject<string[]>([...DEFAULT_JOB_CATEGORIES]);

  public jobs$ = this.jobsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();

  constructor() {
    this.loadJobMetadata();
    this.loadJobs();
  }

  // Load job categories from Firebase or use defaults
  private loadJobMetadata() {
    // Load job categories from Firebase config
    const categoriesRef = ref(db, 'config/jobCategories');
    onValue(categoriesRef, (snapshot) => {
      if (snapshot.val() && Array.isArray(snapshot.val())) {
        this.categoriesSubject.next(snapshot.val());
      }
    }, (error) => {
      console.log('Using default job categories:', error.message);
    });
  }

  // Load all jobs from Firebase
  public loadJobs() {
    this.loadingSubject.next(true);
    const jobsRef = ref(db, 'jobs');
    
    onValue(jobsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const jobs = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as Job[];
        this.jobsSubject.next(jobs);
      } else {
        this.jobsSubject.next([]);
      }
      this.loadingSubject.next(false);
    }, (error) => {
      console.error('Error loading jobs:', error);
      this.jobsSubject.next([]);
      this.loadingSubject.next(false);
    });
  }

  // Get jobs filtered by category
  public getJobsByCategory(category: string): Observable<Job[]> {
    return new Observable(subscriber => {
      this.jobs$.subscribe(jobs => {
        if (category === 'All Latest Jobs') {
          subscriber.next(jobs);
        } else {
          subscriber.next(jobs.filter(job => job.category === category));
        }
      });
    });
  }

  // Add new job
  public async addJob(job: Partial<Job>): Promise<void> {
    const jobsRef = ref(db, 'jobs');
    const { id, ...jobData } = job;
    const newJobData = {
      ...jobData,
      createdDate: new Date().toISOString().split('T')[0]
    };
    return push(jobsRef, newJobData).then(() => {});
  }

  // Update existing job
  public async updateJob(jobId: string, job: Partial<Job>): Promise<void> {
    const jobRef = ref(db, `jobs/${jobId}`);
    const { id, ...jobData } = job;
    return update(jobRef, jobData);
  }

  // Delete job
  public async deleteJob(jobId: string): Promise<void> {
    const jobRef = ref(db, `jobs/${jobId}`);
    return remove(jobRef);
  }

  // Get current categories
  public getCategories(): string[] {
    return this.categoriesSubject.value;
  }

  // Utility methods for job filtering and sorting
  public getNewJobs(jobs: Job[], days: number = 7): Job[] {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return jobs.filter(job => {
      const createdDate = new Date(job.createdDate);
      return createdDate >= daysAgo;
    }).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }

  public getOtherJobs(jobs: Job[], days: number = 7): Job[] {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return jobs.filter(job => {
      const createdDate = new Date(job.createdDate);
      return createdDate < daysAgo;
    }).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }
}