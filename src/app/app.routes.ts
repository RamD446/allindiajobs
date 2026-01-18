import { Routes } from '@angular/router';
import { JobCategoryComponent } from './components/job-category/job-category.component';
import { LoginComponent } from './components/login/login.component';
import { JobDetailComponent } from './components/job-detail/job-detail.component';
import { InfoPageComponent } from './components/info-page/info-page.component';

export const routes: Routes = [
  { path: '', redirectTo: '/all-latest-jobs', pathMatch: 'full' },
  { path: 'all-latest-jobs', component: JobCategoryComponent },
  { path: 'government-jobs', component: JobCategoryComponent },
  { path: 'private-jobs', component: JobCategoryComponent },
  { path: 'walk-in-drives', component: JobCategoryComponent },
  { path: 'about-us', component: InfoPageComponent },
  { path: 'contact-us', component: InfoPageComponent },
  { path: 'privacy-policy', component: InfoPageComponent },
  { path: 'terms-and-conditions', component: InfoPageComponent },
  { path: 'disclaimer', component: InfoPageComponent },
  { path: 'job-details/:id/:title', component: JobDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '/all-latest-jobs' }
];