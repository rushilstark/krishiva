import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header/header';

@Component({
  selector: 'app-learn',
  imports: [CommonModule, HeaderComponent],
  template: `
    <div class="learn-container">
      <app-header title="Learn & Explore" [showBack]="false"></app-header>

      <div class="filters-row">
        <button class="filter-chip" *ngFor="let f of filters" [class.active]="activeFilter === f" (click)="setFilter(f)">{{f}}</button>
      </div>

      <div class="articles-list">
        <div class="article-card" *ngFor="let article of articles">
          <div class="article-image">
            <span class="img-emoji">{{article.image}}</span>
          </div>
          <div class="article-content">
            <h4>{{article.title}}</h4>
            <p>{{article.readTime}}</p>
          </div>
          <div class="chevron">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .learn-container { background: var(--bg-color); min-height: 100vh; padding-bottom: 80px; }
    
    .filters-row {
      display: flex; gap: 8px; padding: 12px 20px; overflow-x: auto;
      background: var(--white); border-bottom: 1px solid var(--light-border);
    }
    .filter-chip {
      padding: 6px 16px; border: 1px solid var(--light-border); border-radius: 20px;
      background: var(--white); font-size: 13px; font-weight: 500; color: var(--text-gray);
      white-space: nowrap; cursor: pointer; transition: all 0.2s;
    }
    .filter-chip.active { background: var(--primary-light); color: var(--primary-green); border-color: var(--primary-green); font-weight: 600; }

    .articles-list { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    
    .article-card {
      display: flex; align-items: center; background: var(--white);
      border-radius: var(--border-radius); padding: 12px;
      border: 1px solid var(--light-border); cursor: pointer; transition: background 0.2s;
    }
    .article-card:hover { background: #f8f9fa; }
    
    .article-image {
      width: 64px; height: 64px; border-radius: 8px; background: #E8F5E9;
      display: flex; justify-content: center; align-items: center; margin-right: 16px; flex-shrink: 0;
    }
    .img-emoji { font-size: 32px; }
    
    .article-content { flex: 1; }
    .article-content h4 { font-size: 14px; font-weight: 600; color: var(--text-dark); margin-bottom: 4px; line-height: 1.4; }
    .article-content p { font-size: 12px; color: var(--text-gray); }
    
    .chevron { color: #999; margin-left: 12px; display: flex; align-items: center; }
  `]
})
export class Learn {
  filters = ['All', 'Farming Tips', 'Pesticide Free', 'Government Schemes'];
  activeFilter = 'All';

  articles = [
    { title: 'How to transition to 100% Organic', readTime: '5 min read', image: '🌱' },
    { title: 'Understanding Soil Health & Nutrients', readTime: '8 min read', image: '🌍' },
    { title: 'Natural Pest Control Methods', readTime: '4 min read', image: '🐞' },
    { title: 'Applying for PM-KISAN Scheme', readTime: '6 min read', image: '📝' },
    { title: 'Water Conservation Techniques', readTime: '7 min read', image: '💧' }
  ];

  setFilter(f: string) {
    this.activeFilter = f;
  }
}
