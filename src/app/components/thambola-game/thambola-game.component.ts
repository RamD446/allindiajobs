import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-thambola-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './thambola-game.component.html',
  styleUrls: ['./thambola-game.component.css']
})
export class ThambolaGameComponent implements OnInit {
  numbers: number[] = Array.from({ length: 90 }, (_, i) => i + 1);
  drawnNumbers: number[] = [];
  currentNumber: number | null = null;
  upcomingNumber: number | null = null;
  gameStarted = false;
  isPaused = false;

  ngOnInit(): void {
    this.prepareUpcoming();
  }

  startGame() {
    this.gameStarted = true;
    if (this.drawnNumbers.length === 0 && !this.currentNumber) {
      this.drawNumber();
    }
  }

  prepareUpcoming() {
    if (this.drawnNumbers.length >= 90) {
      this.upcomingNumber = null;
      return;
    }
    
    let next: number;
    const allDrawn = [...this.drawnNumbers];
    if (this.currentNumber) allDrawn.push(this.currentNumber);
    
    do {
      next = Math.floor(Math.random() * 90) + 1;
    } while (allDrawn.includes(next) && allDrawn.length < 90);
    
    this.upcomingNumber = next;
  }

  drawNumber() {
    if (this.drawnNumbers.length >= 90) {
      alert('All numbers drawn!');
      return;
    }

    if (this.currentNumber) {
      this.drawnNumbers.push(this.currentNumber);
    }

    this.currentNumber = this.upcomingNumber;
    this.prepareUpcoming();
  }

  shareGame() {
    const text = `Thambola Game Numbers Drawn (${this.drawnNumbers.length}): ${[...this.drawnNumbers].reverse().join(', ')}`;
    if (navigator.share) {
      navigator.share({
        title: 'Thambola High Five - AllIndiaJobs',
        text: text,
        url: window.location.href
      }).catch(() => {
        navigator.clipboard.writeText(text).then(() => alert('Numbers copied to clipboard!'));
      });
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Numbers copied to clipboard!'));
    }
  }

  stopGame() {
    this.gameStarted = false;
    this.drawnNumbers = [];
    this.currentNumber = null;
    this.prepareUpcoming();
  }

  isDrawn(num: number): boolean {
    return this.drawnNumbers.includes(num);
  }
}
