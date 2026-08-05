import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'job-category/:category', component: HomeComponent },
  { path: 'walkinjobs', component: HomeComponent },
  { path: 'non-walkinjobs', component: HomeComponent },
  { path: 'IT-Walk-ins', component: HomeComponent },
  { path: 'BPO-Non-IT-Walk-ins', component: HomeComponent },
  { path: 'Fresher-Walk-ins', component: HomeComponent },
  { path: 'Banking-Walk-ins', component: HomeComponent },
  { path: 'Pharma-Walk-ins', component: HomeComponent },
  {
    path: 'thambola-game',
    loadComponent: () => import('./components/thambola-game/thambola-game.component').then(m => m.ThambolaGameComponent)
  },
  {
    path: 'about-us',
    loadComponent: () => import('./components/info-page/info-page.component').then(m => m.InfoPageComponent)
  },
  {
    path: 'contact-us',
    loadComponent: () => import('./components/info-page/info-page.component').then(m => m.InfoPageComponent)
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./components/info-page/info-page.component').then(m => m.InfoPageComponent)
  },
  {
    path: 'terms-and-conditions',
    loadComponent: () => import('./components/info-page/info-page.component').then(m => m.InfoPageComponent)
  },
  {
    path: 'disclaimer',
    loadComponent: () => import('./components/info-page/info-page.component').then(m => m.InfoPageComponent)
  },
  {
    path: 'job/:id/:title',
    loadComponent: () => import('./components/job-full-information/job-full-information').then(m => m.JobFullInformation)
  },
  {
    path: 'job-details/:id/:title',
    loadComponent: () => import('./components/job-full-information/job-full-information').then(m => m.JobFullInformation)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  { path: '**', redirectTo: '' }
];