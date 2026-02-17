import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  
  constructor(private router: Router) {}

  jobTypes = [
    { name: 'Govt Jobs', route: '/government-jobs' },
    { name: 'Private Jobs', route: '/private-jobs' },
    { name: 'Walk-ins', route: '/walk-in-drives' },
    { name: 'Bank Jobs', route: '/banking-jobs' },
    { name: 'IT Jobs', route: '/it-jobs' },
    { name: 'Latest News', route: '/latest-news' }
  ];

  careerTypes = [
    { name: 'MNC Company', type: 'MNC Company' },
    { name: 'Private Job', type: 'Private Job' },
    { name: 'Government', type: 'Government' },
    { name: 'Central Govt', type: 'Central Government' }
  ];

  navigateToCareer(type: string) {
    // Navigate to home/all jobs and use state to tell it to filter by career type
    this.router.navigate(['/all-latest-jobs'], { queryParams: { careerType: type } });
    window.scrollTo(0, 0);
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }

  openRdmWebtech() {
    window.open('https://rdmwebtech.com', '_blank');
  }
}
