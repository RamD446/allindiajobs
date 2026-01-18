import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './info-page.component.html',
  styleUrl: './info-page.component.css'
})
export class InfoPageComponent implements OnInit {
  pageKey = '';
  title = '';
  content = '';
  sanitizedContent: SafeHtml = '' as any;

  private pageContents: { [key: string]: { title: string; content: string } } = {
    'about-us': {
      title: 'About Us',
      content: 'AllIndiaJobs posts daily job information to help users discover opportunities. We do not require login and we do not store customer personal information. This site aggregates job listings to help users find relevant employment.<br><br>Contact: <a href="mailto:ramana9000r@gmail.com">ramana9000r@gmail.com</a>'
    },
    'contact-us': {
      title: 'Contact Us',
      content: 'For partnership or website issues, contact the site administrator at <a href="mailto:ramana9000r@gmail.com">ramana9000r@gmail.com</a>. This site does not collect user data for job browsing.'
    },
    'privacy-policy': {
      title: 'Privacy Policy',
      content: 'We do not collect or store personal user data for browsing jobs. Any submitted job posts or admin actions are managed by site administrators. For queries, email <a href="mailto:ramana9000r@gmail.com">ramana9000r@gmail.com</a>'
    },
    'terms-and-conditions': {
      title: 'Terms & Conditions',
      content: 'This website provides job information as-is. Users agree that the site is an informational portal and does not guarantee employment. For clarifications contact <a href="mailto:ramana9000r@gmail.com">ramana9000r@gmail.com</a>'
    },
    'disclaimer': {
      title: 'Disclaimer',
      content: 'All listings are provided by third parties or administrators. Verify details before applying. The site is for informational purposes only. Contact: <a href="mailto:ramana9000r@gmail.com">ramana9000r@gmail.com</a>'
    }
  };

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // derive the page key from the route path
    const path = this.route.snapshot.url.map(s => s.path).join('/');
    this.pageKey = path || this.route.snapshot.routeConfig?.path || '';

    const data = this.pageContents[this.pageKey];
    if (data) {
      this.title = data.title;
      this.content = data.content;
    } else {
      this.title = 'Info';
      this.content = 'Information about this site.';
    }

    // sanitize HTML content (allows clickable mailto link)
    this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(this.content);
  }
}
