import { Component, signal, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { LayoutComponent } from './components/layout/layout.component';
import { CommonModule } from '@angular/common';
import { ref, get, update } from 'firebase/database';
import { db } from '../config/firebase.config';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, LayoutComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('allindianjobs');
  showWhatsAppBtn = true;
  private lastScrollTop = 0;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo(0, 0);
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const st = window.pageYOffset || document.documentElement.scrollTop;
    if (st > this.lastScrollTop) {
      // Scroll Down - Hide button
      this.showWhatsAppBtn = false;
    } else {
      // Scroll Up - Show button
      this.showWhatsAppBtn = true;
    }
    this.lastScrollTop = st <= 0 ? 0 : st;
  }

  joinWhatsAppGroup() {
    window.open('https://whatsapp.com/channel/0029VbCLJWjCRs1nIKjUlh3p', '_blank');
  }

  ngOnInit() {
    this.trackVisitor();
  }

  private trackVisitor() {
    const now = new Date();
    // Use IST timezone for consistent daily/monthly tracking
    const day = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const month = day.substring(0, 7); // YYYY-MM
    
    const visitorTracked = sessionStorage.getItem('visitor_tracked');
    if (visitorTracked) return;

    try {
      const dailyRef = ref(db, `stats/daily/${day}`);
      const monthlyRef = ref(db, `stats/monthly/${month}`);
      const totalRef = ref(db, 'stats/total');

      get(dailyRef).then(snapshot => {
        const count = (snapshot.val() || 0) + 1;
        update(ref(db, 'stats/daily'), { [day]: count });
      });

      get(monthlyRef).then(snapshot => {
        const count = (snapshot.val() || 0) + 1;
        update(ref(db, 'stats/monthly'), { [month]: count });
      });

      get(totalRef).then(snapshot => {
        const count = (snapshot.val() || 0) + 1;
        update(ref(db, 'stats'), { total: count });
      });

      sessionStorage.setItem('visitor_tracked', 'true');
    } catch (e) {
      console.error('Error tracking visitor:', e);
    }
  }
}
