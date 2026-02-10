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

  private pageContents: { [key: string]: { title: string; content: string } } = {
    'about-us': {
      title: 'About Us',
      content: `
        <h3>Welcome to AllIndiaJobs</h3>
        <p>Hello! I'm Ramana, and I'm passionate about building websites for job seekers. AllIndiaJobs is my dedication to helping people find employment opportunities across India.</p>
        
        <h4>Our Mission</h4>
        <p>AllIndiaJobs posts daily job information to help users discover opportunities. We believe that finding the right job should be accessible to everyone, which is why:</p>
        <ul>
          <li>We do not require login or registration</li>
          <li>We do not store customer personal information</li>
          <li>We provide a clean, user-friendly interface</li>
          <li>We aggregate job listings from various sources</li>
        </ul>
        
        <h4>What We Offer</h4>
        <p>Our platform focuses on three main categories:</p>
        <ul>
          <li><strong>Government Jobs</strong> - Latest government sector opportunities</li>
          <li><strong>Private Jobs</strong> - Corporate and private sector positions</li>
          <li><strong>Walk-in Drives</strong> - Immediate hiring opportunities</li>
        </ul>
        
        <p>I'm committed to continuously improving this platform to serve job seekers better. Your feedback and suggestions are always welcome.</p>
        
        <h4>Contact Me</h4>
        <p>For any questions, suggestions, or partnership opportunities, feel free to reach out:</p>
        <p><strong>Email:</strong> <a href="mailto:raman9000r@gmail.com">raman9000r@gmail.com</a></p>
        
        <p><em>Together, let's make job searching simpler and more effective!</em></p>
      `
    },
    'contact-us': {
      title: 'Contact Us',
      content: 'For partnership or website issues, contact the site administrator at <a href="mailto:ramana9000r@gmail.com">ramana9000r@gmail.com</a>. This site does not collect user data for job browsing.'
    },
    'privacy-policy': {
      title: '🔐 Privacy Policy',
      content: `
        <p><strong>Last updated:</strong> January 20, 2026</p>
        
        <p>At AllIndiaJobs.com, we respect your privacy and are committed to protecting your personal information.</p>
        
        <h4>Information We Collect</h4>
        <p>We may collect the following information:</p>
        <ul>
          <li>Personal details (such as name or email) only if you voluntarily provide them (e.g., contact forms).</li>
          <li>Non-personal data such as browser type, device information, IP address, and pages visited for analytics purposes.</li>
        </ul>
        
        <h4>How We Use Your Information</h4>
        <ul>
          <li>To improve website performance and user experience</li>
          <li>To respond to user queries or feedback</li>
          <li>To analyze traffic and usage patterns</li>
        </ul>
        
        <h4>Cookies</h4>
        <p>AllIndiaJobs.com may use cookies to:</p>
        <ul>
          <li>Improve website functionality</li>
          <li>Analyze traffic and user behavior</li>
        </ul>
        <p>You can choose to disable cookies through your browser settings.</p>
        
        <h4>Third-Party Services</h4>
        <p>We may use third-party services such as:</p>
        <ul>
          <li>Google Analytics</li>
          <li>Google AdSense (if applicable)</li>
        </ul>
        <p>These third parties may use cookies or similar technologies according to their own privacy policies. We do not control how third-party services collect or use data.</p>
        
        <h4>External Links</h4>
        <p>Our website may contain links to external websites. We are not responsible for the privacy practices or content of those external sites.</p>
        
        <h4>Data Security</h4>
        <p>We take reasonable measures to protect your information, but no method of transmission over the internet is 100% secure.</p>
        
        <h4>Children's Information</h4>
        <p>AllIndiaJobs.com does not knowingly collect personal information from children under the age of 13.</p>
        
        <h4>Changes to This Policy</h4>
        <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page.</p>
        
        <h4>Contact Us</h4>
        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
        <p>📧 <a href="mailto:raman9000r@gmail.com">raman9000r@gmail.com</a></p>
      `
    },
    'disclaimer': {
      title: '📄 Disclaimer',
      content: `
        <p><strong>Last updated:</strong> January 20, 2026</p>
        
        <p>AllIndiaJobs.com is an independent job information website. We collect job notifications from various official websites, newspapers, employment news, and other public sources and publish them for informational purposes only.</p>
        
        <h4>Important Points:</h4>
        <ul>
          <li>AllIndiaJobs.com is not affiliated with any government organization, recruitment board, or private company.</li>
          <li>We do not guarantee the accuracy, completeness, or timeliness of the job information published on this website.</li>
          <li>Users are strongly advised to verify all details such as eligibility, application process, fees, and deadlines from the official notification or official website before applying.</li>
          <li>We do not charge any money for job information or job applications.</li>
          <li>All logos, names, and trademarks belong to their respective owners.</li>
          <li>We are not responsible for any loss, damage, or inconvenience caused due to reliance on the information provided on this website.</li>
          <li>If you have any issues or believe that any content violates copyright, please contact us, and we will take appropriate action.</li>
        </ul>
        
        <h4>Contact Us</h4>
        <p>If you have any questions about this Disclaimer, please contact us at:</p>
        <p>📧 <a href="mailto:raman9000r@gmail.com">raman9000r@gmail.com</a></p>
      `
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
