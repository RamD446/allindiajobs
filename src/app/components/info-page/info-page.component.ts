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
  subtitle = '';
  content = '';
  sanitizedContent: SafeHtml = '' as any;
  pageIcon = 'bi-info-circle-fill';
  pageIconColor = '#667eea';

  private pageContents: { [key: string]: { title: string; content: string } } = {
    'about-us': {
      title: 'About Us',
      content: `
        <h3>About All India Jobs</h3>
        <p>All India Jobs is an independent job information platform focused on helping candidates discover verified openings quickly. We gather publicly available opportunities from official company career pages and present them in a clean, easy-to-read format.</p>
        
        <h4>What We Do</h4>
        <ul>
          <li>Publish role-wise job updates from trusted official sources.</li>
          <li>Share direct application paths to official company portals.</li>
          <li>Organize jobs by category, education, location, and experience.</li>
          <li>Provide concise details so applicants can act faster.</li>
        </ul>

        <h4>Important Clarification</h4>
        <ul>
          <li>We never ask for money, fees, or paid registration.</li>
          <li>We are not a recruitment agency and do not conduct hiring rounds.</li>
          <li>We do not guarantee job selection or placement.</li>
          <li>We do not collect resumes or personal hiring documents.</li>
        </ul>

        <p>Our mission is simple: provide reliable job information and direct candidates only to official application pages.</p>
        <p><strong>Email:</strong> <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
      `
    },

    'contact-us': {
      title: 'Contact Us',
      content: `
        <p>For questions, corrections, or business inquiries, please reach out through the contact details below.</p>
        <p><strong>Email:</strong> <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
        <p><strong>Website:</strong> <a href="https://allindajobs.com">https://allindajobs.com</a></p>
        <p>Our team usually responds within 24 to 48 hours.</p>
      `
    },

    'privacy-policy': {
      title: 'Privacy Policy',
      content: `
        <p><strong>Effective Date:</strong> February 17, 2026</p>
        <p>Your privacy matters to us. This policy explains what data we collect, how we use it, and the limits of our responsibility.</p>
        
        <h4>1. Information We Collect</h4>
        <p>We do not collect or store:</p>
        <ul>
          <li>User accounts</li>
          <li>Personal login details</li>
          <li>Payment details</li>
          <li>Uploaded documents</li>
        </ul>
        <p>You can browse the website without registration or sharing personal profile data.</p>
        
        <h4>2. Job Information</h4>
        <p>Job details are sourced from official company career pages. When you click Apply, you are redirected to the employer's official website.</p>
        
        <h4>3. Third-Party Services</h4>
        <p>We may use services such as Google Analytics and Google AdSense. These services may use cookies to improve analytics and ad relevance.</p>
        
        <h4>4. External Links</h4>
        <p>Our pages may include external links. We are not responsible for privacy policies or practices followed by third-party websites.</p>
        
        <p>Contact: <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
      `
    },

    'disclaimer': {
      title: 'Disclaimer',
      content: `
        <p>All India Jobs is an informational platform only. We do not offer jobs directly, conduct interviews, or process candidate applications.</p>
        <p>We never demand money for jobs, referrals, registrations, or placement support.</p>
        <p>Candidates are strongly advised to verify every detail on the official employer website before applying. Final recruitment decisions are solely made by the respective companies.</p>
        <p>Contact: <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
      `
    },

    'terms-and-conditions': {
      title: 'Terms and Conditions',
      content: `
        <p>By accessing <a href="https://allindajobs.com">https://allindajobs.com</a>, you agree to the following terms:</p>
        <ul>
          <li>Use this website for lawful purposes only.</li>
          <li>Do not misuse job information for fraudulent or misleading activity.</li>
          <li>Do not reproduce, republish, or redistribute content without permission.</li>
          <li>Always apply through official employer channels.</li>
        </ul>
        <p>We reserve the right to update, modify, or remove content at any time without prior notice.</p>
        <p>Contact: <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
      `
    }
  };

  private subtitleMap: { [key: string]: string } = {
    'about-us': 'Trusted job information. Clear guidance. Official apply links only.',
    'contact-us': 'Reach our team for updates, corrections, and support queries.',
    'privacy-policy': 'Understand how your data is handled while using our platform.',
    'disclaimer': 'Read this carefully before using any job information from this site.',
    'terms-and-conditions': 'Rules and responsibilities for using All India Jobs services.'
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

    this.subtitle = this.subtitleMap[this.pageKey] || 'Essential information for All India Jobs users.';
    this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(this.content);

    const iconData = this.iconMap[this.pageKey];
    if (iconData) {
      this.pageIcon = iconData.icon;
      this.pageIconColor = iconData.color;
    }
  }
}
