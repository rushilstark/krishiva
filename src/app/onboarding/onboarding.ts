import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding',
  imports: [CommonModule],
  template: `
    <div class="onboarding-container">
      <div class="top-bar">
        <span class="logo-text">Krishiva</span>
        <button class="skip-btn" (click)="skip()">Skip</button>
      </div>
      
      <div class="carousel-container">
        <div class="slides-wrapper" [style.transform]="'translateX(-' + currentIndex * 100 + '%)'">
          <div class="slide" *ngFor="let slide of slides">
            <img [src]="slide.image" [alt]="slide.title" class="slide-image">
            <h2 class="slide-title">{{slide.title}}</h2>
            <p class="slide-subtitle">{{slide.subtitle}}</p>
          </div>
        </div>
      </div>

      <div class="bottom-section">
        <div class="pagination">
          <div class="dot" *ngFor="let slide of slides; let i = index" [class.active]="i === currentIndex"></div>
        </div>
        <button class="btn-primary" (click)="next()">{{ currentIndex === slides.length - 1 ? 'Get Started' : 'Next &rarr;' }}</button>
      </div>
    </div>
  `,
  styles: [`
    .onboarding-container {
      display: flex; flex-direction: column; height: 100vh; padding: 24px;
      background-color: var(--white);
    }
    .top-bar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px;
    }
    .logo-text { font-size: 18px; font-weight: 700; color: var(--primary-green); }
    .skip-btn { background: none; border: none; color: var(--text-gray); font-size: 14px; font-weight: 500; cursor: pointer; }
    
    .carousel-container {
      flex: 1; overflow: hidden; position: relative;
    }
    .slides-wrapper {
      display: flex; height: 100%; transition: transform 0.3s ease-in-out;
    }
    .slide {
      min-width: 100%; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .slide-image { width: 100%; max-height: 250px; object-fit: contain; margin-bottom: 32px; border-radius: 50%; }
    .slide-title { font-size: 24px; text-align: center; margin-bottom: 12px; color: var(--text-dark); font-weight: 700; }
    .slide-subtitle { font-size: 14px; text-align: center; color: var(--text-gray); line-height: 1.5; padding: 0 16px; }

    .bottom-section {
      padding-bottom: 24px;
    }
    .pagination {
      display: flex; justify-content: center; gap: 8px; margin-bottom: 32px;
    }
    .dot { width: 8px; height: 8px; border-radius: 4px; background-color: #E0E0E0; transition: all 0.3s ease; }
    .dot.active { width: 24px; background-color: var(--primary-green); }
  `]
})
export class Onboarding {
  currentIndex = 0;
  slides = [
    {
      image: '/splash.jpg',
      title: 'Bringing Organic Goodness to Everyone',
      subtitle: 'Buy fresh organic products, connect with farmers and learn together.'
    },
    {
      image: '/splash.jpg',
      title: 'Direct from the Farmers',
      subtitle: 'No middlemen. Get the freshest produce delivered straight to your door.'
    },
    {
      image: '/splash.jpg',
      title: 'Grow Your Business',
      subtitle: 'Join a community of thousands of farmers and buyers across the country.'
    }
  ];

  constructor(private router: Router) {}

  next() {
    if (this.currentIndex < this.slides.length - 1) {
      this.currentIndex++;
    } else {
      this.router.navigate(['/login']);
    }
  }

  skip() {
    this.router.navigate(['/login']);
  }
}
