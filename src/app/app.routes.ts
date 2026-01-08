import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AllLatestJobsComponent } from './components/all-latest-jobs/all-latest-jobs.component';
import { GovernmentJobsComponent } from './components/government-jobs/government-jobs.component';
import { ItSoftwareJobsComponent } from './components/it-software-jobs/it-software-jobs.component';
import { BankingFinanceJobsComponent } from './components/banking-finance-jobs/banking-finance-jobs.component';
import { WalkInDriveJobsComponent } from './components/walk-in-drive-jobs/walk-in-drive-jobs.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { AdminComponent } from './components/admin/admin.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'all-latest-jobs', component: AllLatestJobsComponent },
  { path: 'government-jobs', component: GovernmentJobsComponent },
  { path: 'it-software-jobs', component: ItSoftwareJobsComponent },
  { path: 'banking-finance-jobs', component: BankingFinanceJobsComponent },
  { path: 'walk-in-drive-jobs', component: WalkInDriveJobsComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '/' }
];