import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { JobCategoryComponent } from './components/job-category/job-category.component';
import { LoginComponent } from './components/login/login.component';
import { JobFullInformation } from './components/job-full-information/job-full-information';
import { InfoPageComponent } from './components/info-page/info-page.component';
import { OfficialCompanyCareersComponent } from './components/official-company-careers/official-company-careers.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'IT Walk-ins', component: JobCategoryComponent },
  { path: 'BPO Walk-ins', component: JobCategoryComponent },
  { path: 'Non-IT Walk-ins', component: JobCategoryComponent },
  { path: 'Sales Walk-ins', component: JobCategoryComponent },
  { path: 'Banking Walk-ins', component: JobCategoryComponent },
  { path: 'Pharma Walk-ins', component: JobCategoryComponent },
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