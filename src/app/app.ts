import { Component, signal, OnInit, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { ref, get, update } from 'firebase/database';
import { db } from '../config/firebase.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('allindianjobs');
  showWhatsAppBtn = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showWhatsAppBtn = window.pageYOffset > 300;
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
