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
  today: Date = new Date();
  pageKey = '';
  title = '';
  content = '';
  sanitizedContent: SafeHtml = '' as any;
  showCombined = false;
  combinedSections: any[] = [];

  private pageContents: { [key: string]: { title: string; content: string } } = {
    'about-us': {
      title: 'About Us',
      content: `
        <h3>Welcome to AllIndiaJobs</h3>
        <p>AllIndiaJobs provides daily job updates across India to help job seekers find opportunities easily.</p>

        <h4>Our Mission</h4>
        <ul>
          <li>No login or registration required</li>
          <li>No personal data collection for browsing</li>
          <li>Simple and user-friendly interface</li>
          <li>Job updates from trusted public sources</li>
        </ul>

        <h4>Job Categories</h4>
        <ul>
          <li>Government Jobs</li>
          <li>Private Jobs</li>
          <li>Walk-in Drives</li>
        </ul>

        <p><strong>Email:</strong> <a href="mailto:raman9000r@gmail.com">raman9000r@gmail.com</a></p>
      `
    },

    'contact-us': {
      title: 'Contact Us',
      content: `
        <p>For website issues or partnerships, contact us at:</p>
        <p><strong>Email:</strong> <a href="mailto:ramana9000r@gmail.com">ramana9000r@gmail.com</a></p>
        <p>We do not collect personal information for browsing jobs.</p>
      `
    },

    'privacy-policy': {
      title: 'Privacy Policy',
      content: `
        <p><strong>Last Updated:</strong> January 20, 2026</p>

        <p>We respect your privacy. We may collect limited data such as browser type, device information, and analytics data to improve our website.</p>

        <h4>We Use Information To:</h4>
        <ul>
          <li>Improve user experience</li>
          <li>Respond to inquiries</li>
          <li>Analyze website traffic</li>
        </ul>

        <p>We may use cookies and third-party services like Google Analytics or AdSense. Users can disable cookies in browser settings.</p>

        <p>For questions, contact: 
        <a href="mailto:raman9000r@gmail.com">raman9000r@gmail.com</a></p>
      `
    },

    'disclaimer': {
      title: 'Disclaimer',
      content: `
        <p><strong>Last Updated:</strong> January 20, 2026</p>

        <p>AllIndiaJobs is an independent job information website. We publish job notifications collected from official websites and public sources.</p>

        <ul>
          <li>We are not affiliated with any government or private organization.</li>
          <li>Users should verify details from official websites before applying.</li>
          <li>We do not charge any fees.</li>
          <li>We are not responsible for errors or losses arising from the use of information.</li>
        </ul>

        <p>Contact: <a href="mailto:raman9000r@gmail.com">raman9000r@gmail.com</a></p>
      `
    }
  };

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // derive the page key from the route path
    const path = this.route.snapshot.url.map(s => s.path).join('/');
    this.pageKey = path || this.route.snapshot.routeConfig?.path || '';

    // Check if we should show combined view (About, Disclaimer, Privacy)
    const combinedKeys = ['about-us', 'disclaimer', 'privacy-policy'];
    if (combinedKeys.includes(this.pageKey)) {
      this.showCombined = true;
      this.combinedSections = combinedKeys.map(key => {
        const data = this.pageContents[key];
        return {
          key,
          title: data.title,
          content: this.sanitizer.bypassSecurityTrustHtml(data.content)
        };
      });
      this.title = 'Site Information';
    } else {
      this.showCombined = false;
      const data = this.pageContents[this.pageKey];
      if (data) {
        this.title = data.title;
        this.content = data.content;
      } else {
        this.title = 'Info';
        this.content = 'Information about this site.';
      }
      this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(this.content);
    }
  }
}
