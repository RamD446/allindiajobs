import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { JobCategoryComponent } from './components/job-category/job-category.component';
import { LoginComponent } from './components/login/login.component';
import { JobFullInformation } from './components/job-full-information/job-full-information';
import { InfoPageComponent } from './components/info-page/info-page.component';
import { OfficialCompanyCareersComponent } from './components/official-company-careers/official-company-careers.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'government-jobs', component: JobCategoryComponent },
  { path: 'government-job-results', component: JobCategoryComponent },
  { path: 'walk-in-drives', component: JobCategoryComponent },
  { path: 'banking-jobs', component: JobCategoryComponent },
  { path: 'it-jobs', component: JobCategoryComponent },
  { path: 'non-it-jobs', component: JobCategoryComponent },
  { path: 'pharmaceutical-jobs', component: JobCategoryComponent },
  { path: 'all-private-jobs', component: JobCategoryComponent },
  { path: 'fresher-jobs', component: JobCategoryComponent },
  { path: 'today-jobs', component: JobCategoryComponent },
  { path: 'today-walkins', component: JobCategoryComponent },
  { path: 'today-expired-gov-jobs', component: JobCategoryComponent },
  { path: 'health-and-career-tips', component: JobCategoryComponent },
  { path: 'motivation-stories', component: JobCategoryComponent },
  { path: 'current-affairs', component: JobCategoryComponent },
  { path: 'telugu-to-english-learning', component: JobCategoryComponent },
  { path: 'official-company-careers', component: OfficialCompanyCareersComponent },
  { path: 'about-us', component: InfoPageComponent },
  { path: 'contact-us', component: InfoPageComponent },
  { path: 'privacy-policy', component: InfoPageComponent },
  { path: 'terms-and-conditions', component: InfoPageComponent },
  { path: 'disclaimer', component: InfoPageComponent },
  { path: 'job/:id/:title', component: JobFullInformation },
  { path: 'job-details/:id/:title', component: JobFullInformation }, // Legacy route support
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '' }
];