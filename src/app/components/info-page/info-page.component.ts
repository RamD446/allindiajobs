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
  pageIcon = 'bi-info-circle-fill';
  pageIconColor = '#667eea';

  private pageContents: { [key: string]: { title: string; content: string } } = {
    'about-us': {
      title: 'About Us',
      content: `
        <h3>About All India Jobs</h3>
        <p>All India Jobs is an independent job information website. We collect publicly available job information from official company websites and present it here in an easily understandable format for job seekers.</p>
        
        <h4>What We Do:</h4>
        <ul>
          <li>We do not collect any fees.</li>
          <li>We do not provide recruitment services.</li>
          <li>We do not guarantee job placement.</li>
          <li>We do not collect your resumes.</li>
        </ul>
        <p>Our main goal is to provide genuine job information (Job Updates) and guide you to official application pages only.</p>
        <p><strong>Email:</strong> <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
      `
    },

    'contact-us': {
      title: 'Contact Us',
      content: `
        <p>If you have any questions, need corrections in job information, or have other inquiries, please contact us:</p>
        <p><strong>📧 Email:</strong> <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
        <p><strong>🌐 Website:</strong> <a href="https://allindajobs.com">https://allindajobs.com</a></p>
        <p>We will respond to your email within 24–48 hours.</p>
      `
    },

    'privacy-policy': {
      title: 'Privacy Policy',
      content: `
        <p><strong>Date:</strong> February 17, 2026</p>
        <p>Welcome to the All India Jobs website. We respect your privacy.</p>
        
        <h4>1. Information We Collect</h4>
        <p>We do not collect:</p>
        <ul>
          <li>User accounts</li>
          <li>Personal login details</li>
          <li>Payment details</li>
          <li>Uploaded documents</li>
        </ul>
        <p>You do not need to register or provide personal information to use this website.</p>
        
        <h4>2. Job Information</h4>
        <p>All job details published on this website are collected from official company career pages. When users click the "Apply" button, they are directed to that company's official website.</p>
        
        <h4>3. Third-Party Services</h4>
        <p>We use Google Analytics for website analysis and Google AdSense for advertising. These may use cookies.</p>
        
        <h4>4. External Links</h4>
        <p>Our website contains links to other official job pages. We are not responsible for the privacy policies of those websites.</p>
        
        <p>Contact: <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
      `
    },

    'disclaimer': {
      title: 'Disclaimer',
      content: `
        <p>All India Jobs is not a recruitment agency. We do not directly provide jobs, conduct interviews, or process applications. We never ask for money for jobs.</p>
        <p>We only provide information. Candidates should verify details on official websites before applying for any job. We are not responsible for any consequences in the job selection process.</p>
        <p>Contact: <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
      `
    },

    'terms-and-conditions': {
      title: 'Terms & Conditions',
      content: `
        <p>By using <a href="https://allindajobs.com">https://allindajobs.com</a>, you agree to the following:</p>
        <ul>
          <li>Use the website for legal purposes only.</li>
          <li>Do not use job information for fraudulent activities.</li>
          <li>Do not copy or republish website content without permission.</li>
        </ul>
        <p>We reserve the right to update or remove content without prior notice.</p>
        <p>Contact: <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
      `
    }
  };

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) {}

  private iconMap: { [key: string]: { icon: string; color: string } } = {
    'about-us':             { icon: 'bi-people-fill',            color: '#1565c0' },
    'disclaimer':           { icon: 'bi-exclamation-triangle-fill', color: '#f59e0b' },
    'privacy-policy':       { icon: 'bi-shield-lock-fill',       color: '#16a34a' },
    'terms-and-conditions': { icon: 'bi-file-earmark-text-fill', color: '#0891b2' },
    'contact-us':           { icon: 'bi-envelope-fill',          color: '#dc2626' }
  };

  ngOnInit() {
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
    this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(this.content);

    const iconData = this.iconMap[this.pageKey];
    if (iconData) {
      this.pageIcon = iconData.icon;
      this.pageIconColor = iconData.color;
    }
  }
}
