import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="product-card" [routerLink]="['/product', product.id]">
      <div class="card-image-container">
        <span class="product-emoji">{{ product.imageUrl }}</span>
        <span *ngIf="product.isOrganic" class="organic-badge">🌱 Organic</span>
      </div>
      <div class="card-content">
        <h3 class="product-title">{{ product.name }}</h3>
        <p class="seller-name">{{ product.sellerName }}</p>
        <div class="price-row">
          <span class="price">₹{{ product.price }} / {{ product.unit }}</span>
          <div class="rating">
            <span class="star">⭐</span>
            <span class="rating-value">{{ product.rating }}</span>
          </div>
        </div>
        <button class="add-button" (click)="onAdd($event)">+</button>
      </div>
    </div>
  `,
  styles: [`
    .product-card {
      background: var(--white);
      border-radius: var(--card-radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border: 1px solid var(--light-border);
      overflow: hidden;
      cursor: pointer;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .card-image-container {
      background: var(--bg-color);
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .product-emoji {
      font-size: 4rem;
    }
    .organic-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background: var(--primary-light);
      color: var(--primary-dark);
      padding: 4px 8px;
      border-radius: var(--border-radius);
      font-size: 0.7rem;
      font-weight: 600;
    }
    .card-content {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .product-title {
      margin: 0;
      font-size: 1rem;
      color: var(--text-dark);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .seller-name {
      margin: 0;
      font-size: 0.8rem;
      color: var(--text-gray);
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }
    .price {
      font-weight: 700;
      color: var(--primary-green);
      font-size: 0.95rem;
    }
    .rating {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 0.85rem;
    }
    .star {
      font-size: 0.9rem;
    }
    .add-button {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: var(--primary-green);
      color: var(--white);
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(46, 125, 50, 0.2);
    }
    .add-button:hover {
      background: var(--primary-dark);
    }
  `]
})
export class ProductCardComponent {
  @Input({ required: true }) product!: any;
  @Output() add = new EventEmitter<any>();

  onAdd(event: Event) {
    event.stopPropagation();
    this.add.emit(this.product);
  }
}
