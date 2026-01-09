import { Routes } from '@angular/router';
import { JobCategoryComponent } from './components/job-category/job-category.component';
import { LoginComponent } from './components/login/login.component';
import { JobDetailComponent } from './components/job-detail/job-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: '/all-latest-jobs', pathMatch: 'full' },
  { path: 'all-latest-jobs', component: JobCategoryComponent },
  { path: 'it-software-jobs', component: JobCategoryComponent },
  { path: 'non-it-bpo-jobs', component: JobCategoryComponent },
  { path: 'government-jobs', component: JobCategoryComponent },
  { path: 'private-bank-jobs', component: JobCategoryComponent },
  { path: 'walk-in-drive-jobs', component: JobCategoryComponent },
  { path: 'job-details/:id', component: JobDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '/all-latest-jobs' }
];