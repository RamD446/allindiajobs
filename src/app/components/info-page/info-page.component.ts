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
        <h3>About All India Jobs</h3>
        <p>All India Jobs is an independent job information website. We collect publicly available job information from official company websites and publish it in a simplified format to help job seekers easily find employment opportunities.</p>
        
        <h4>What We Do:</h4>
        <ul>
          <li>Do NOT charge any fees</li>
          <li>Do NOT offer recruitment services</li>
          <li>Do NOT guarantee job placement</li>
          <li>Do NOT collect resumes</li>
        </ul>
        <p>Our goal is to provide genuine job updates and guide users to official application pages.</p>
        <p><strong>Email:</strong> <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
      `
    },

    'contact-us': {
      title: 'Contact Us',
      content: `
        <p>If you have any questions, job update corrections, or business inquiries, please contact us:</p>
        <p><strong>📧 Email:</strong> <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
        <p><strong>🌐 Website:</strong> <a href="https://allindajobs.com">https://allindajobs.com</a></p>
        <p>We aim to respond within 24–48 hours.</p>
      `
    },

    'privacy-policy': {
      title: 'Privacy Policy',
      content: `
        <p><strong>Effective Date:</strong> February 17, 2026</p>
        <p>Welcome to <a href="https://allindajobs.com">https://allindajobs.com</a>. At All India Jobs, we respect your privacy.</p>
        
        <h4>1. Information We Collect</h4>
        <p>We do NOT collect:</p>
        <ul>
          <li>User accounts</li>
          <li>Personal login information</li>
          <li>Payment details</li>
          <li>Uploaded documents</li>
        </ul>
        <p>Users are not required to register or provide personal information to use this website.</p>
        <p>We may automatically collect basic non-personal information such as: Browser type, Device type, Anonymous traffic data. This information is used only for website improvement and analytics purposes.</p>
        
        <h4>2. Job Information</h4>
        <p>All job listings published on this website are publicly available information collected from official company career pages. We do not modify official application processes. When users click the "Apply" button, they are redirected to the official company website.</p>
        
        <h4>3. Third-Party Services</h4>
        <p>We may use third-party services such as: Google Analytics for traffic analysis, Google AdSense for advertisements. These services may use cookies to display ads or analyze usage.</p>
        
        <h4>4. External Links</h4>
        <p>Our website contains links to external official job pages. We are not responsible for the privacy policies or practices of those external websites.</p>
        
        <h4>5. Consent</h4>
        <p>By using our website, you agree to this Privacy Policy.</p>
        
        <p>Contact: <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
      `
    },

    'disclaimer': {
      title: 'Disclaimer',
      content: `
        <p>All India Jobs is not a recruitment agency. We do not: Offer jobs directly, Conduct interviews, Ask for money, or Process applications. All job listings redirect users to official company websites for application.</p>
        <p>We are not responsible for hiring decisions, interview processes, or employment outcomes. Users should verify all job details directly from the official employer.</p>
        <p>Contact: <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
      `
    },

    'terms-and-conditions': {
      title: 'Terms & Conditions',
      content: `
        <p>By using <a href="https://allindajobs.com">https://allindajobs.com</a>, you agree:</p>
        <ul>
          <li>To use the website for lawful purposes only.</li>
          <li>Not to misuse job information for fraudulent activities.</li>
          <li>Not to copy or republish website content without permission.</li>
        </ul>
        <p>We reserve the right to update or remove content without notice.</p>
        <p>Contact: <a href="mailto:Ramana9000r@gmail.com">Ramana9000r@gmail.com</a></p>
      `
    }
  };

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // derive the page key from the route path
    const path = this.route.snapshot.url.map(s => s.path).join('/');
    this.pageKey = path || this.route.snapshot.routeConfig?.path || '';

    // Check if we should show combined view (About, Disclaimer, Privacy, Terms, Contact)
    let combinedKeys = ['about-us', 'disclaimer', 'privacy-policy', 'terms-and-conditions', 'contact-us'];
    if (combinedKeys.includes(this.pageKey)) {
      this.showCombined = true;
      
      // Reorder: move the clicked page key to the first position
      const otherKeys = combinedKeys.filter(key => key !== this.pageKey);
      const reorderedKeys = [this.pageKey, ...otherKeys];
      
      this.combinedSections = reorderedKeys.map(key => {
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
