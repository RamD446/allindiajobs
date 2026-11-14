import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/home/home.component').then((module) => module.HomeComponent) },
  { path: 'official-career-links', loadComponent: () => import('./components/career-links/career-links.component').then((module) => module.CareerLinksComponent) },
  { path: 'job/:id/:title', loadComponent: () => import('./components/job-full-information/job-full-information').then((module) => module.JobFullInformation) },
  { path: 'job-details/:id/:title', loadComponent: () => import('./components/job-full-information/job-full-information').then((module) => module.JobFullInformation) },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then((module) => module.LoginComponent) },
  { path: '**', redirectTo: '' }
];