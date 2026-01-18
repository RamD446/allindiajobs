import { Routes } from '@angular/router';
import { JobCategoryComponent } from './components/job-category/job-category.component';
import { LoginComponent } from './components/login/login.component';
import { JobDetailComponent } from './components/job-detail/job-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: '/all-latest-jobs', pathMatch: 'full' },
  { path: 'all-latest-jobs', component: JobCategoryComponent },
  { path: 'government-jobs', component: JobCategoryComponent },
  { path: 'private-jobs', component: JobCategoryComponent },
  { path: 'walk-in-drives', component: JobCategoryComponent },
  { path: 'job-details/:id/:title', component: JobDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '/all-latest-jobs' }
];