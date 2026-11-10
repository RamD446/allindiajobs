import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Job } from '../../models/job.model';

@Component({
  selector: 'app-recent-posts',
  imports: [CommonModule, RouterModule],
  templateUrl: './recent-posts.component.html',
  styleUrl: './recent-posts.component.css',
})
export class RecentPostsComponent {
  @Input() jobs: Job[] = [];
  @Input() title: string = 'Recent Posts';
  @Input() showImages: boolean = true;
  @Output() jobSelected = new EventEmitter<Job>();

  getRecentPostImage(job: Job): string | null {
    const imageHtml = job.companyImage || '';
    const imageSrc = this.extractImageSrc(imageHtml);
    return imageSrc || 'assets/images/Freejobinfologo.png';
  }

  private extractImageSrc(value: string): string | null {
    const raw = (value || '').trim();
    if (!raw) return null;

    const match = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) return match[1];

    if (raw.startsWith('data:image/')) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;

    return null;
  }

  formatWalkInDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return '';
    }
  }

  viewJobDetails(job: Job) {
    this.jobSelected.emit(job);
  }
}
