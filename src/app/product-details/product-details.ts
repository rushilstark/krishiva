import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="product-details-container" *ngIf="product(); else loading">
      <header class="header">
        <button class="back-btn" routerLink="/market">←</button>
        <h2>Product Details</h2>
        <div class="header-actions"></div>
      </header>

      <div class="hero-image">
        <span class="hero-emoji">{{ product().imageUrl }}</span>
        <span *ngIf="product().isOrganic" class="organic-badge">🌱 Organic</span>
      </div>

      <div class="content">
        <div class="title-section">
          <h1 class="product-title">{{ product().name }}</h1>
          <div class="rating-price-row">
            <div class="rating">
              <span>⭐ {{ product().rating }}</span>
            </div>
            <div class="price">
              ₹{{ product().price }} / {{ product().unit }}
            </div>
          </div>
        </div>

        <div class="description-section">
          <h3>Description</h3>
          <p>{{ product().description }}</p>
        </div>

        <div class="seller-card">
          <div class="seller-avatar">🧑‍🌾</div>
          <div class="seller-info">
            <h4>{{ product().sellerName }}</h4>
            <p class="location">📍 {{ product().sellerLocation }}</p>
          </div>
        </div>
      </div>

      <div class="bottom-actions">
        <button class="btn-outline" (click)="addToCart()">Add to Cart</button>
        <button class="btn-primary" (click)="buyNow()">Buy Now</button>
      </div>
    </div>
    <ng-template #loading>
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading product...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .product-details-container {
      background: var(--bg-color);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding-bottom: 80px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: var(--white);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header h2 {
      margin: 0;
      font-size: 1.2rem;
      color: var(--text-dark);
    }
    .back-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-dark);
    }
    .hero-image {
      background: var(--white);
      height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      border-bottom: 1px solid var(--light-border);
    }
    .hero-emoji {
      font-size: 8rem;
    }
    .organic-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      background: var(--primary-light);
      color: var(--primary-dark);
      padding: 6px 12px;
      border-radius: var(--border-radius);
      font-weight: 600;
    }
    .content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .title-section h1 {
      margin: 0 0 8px 0;
      color: var(--text-dark);
      font-size: 1.5rem;
    }
    .rating-price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .rating {
      background: var(--white);
      padding: 4px 8px;
      border-radius: var(--border-radius);
      border: 1px solid var(--light-border);
      font-weight: 500;
    }
    .price {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--primary-green);
    }
    .description-section h3 {
      margin: 0 0 8px 0;
      color: var(--text-dark);
      font-size: 1.1rem;
    }
    .description-section p {
      margin: 0;
      color: var(--text-gray);
      line-height: 1.5;
    }
    .seller-card {
      background: var(--white);
      padding: 16px;
      border-radius: var(--card-radius);
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid var(--light-border);
    }
    .seller-avatar {
      font-size: 2.5rem;
      background: var(--bg-color);
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .seller-info h4 {
      margin: 0 0 4px 0;
      color: var(--text-dark);
      font-size: 1.1rem;
    }
    .seller-info .location {
      margin: 0;
      color: var(--text-gray);
      font-size: 0.9rem;
    }
    .bottom-actions {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      background: var(--white);
      border-top: 1px solid var(--light-border);
      display: flex;
      gap: 12px;
      z-index: 10;
      max-width: 480px;
      margin: 0 auto;
    }
    .bottom-actions button {
      flex: 1;
      padding: 14px;
      border-radius: var(--border-radius);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-outline {
      background: var(--white);
      border: 2px solid var(--primary-green);
      color: var(--primary-green);
    }
    .btn-primary {
      background: var(--primary-green);
      border: none;
      color: var(--white);
    }
    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: var(--text-gray);
    }
    .spinner {
      border: 4px solid var(--light-border);
      border-top: 4px solid var(--primary-green);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);

  product = signal<any>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.productService.getProductById(id).subscribe(p => {
          this.product.set(p);
        });
      }
    });
  }

  addToCart() {
    if (this.product()) {
      this.cartService.addToCart(this.product());
    }
  }

  buyNow() {
    if (this.product()) {
      this.orderService.addOrder({
        items: [{ product: this.product(), quantity: 1 }],
        totalAmount: this.product().price,
        status: 'pending',
        createdAt: new Date()
      });
      this.router.navigate(['/orders']);
    }
  }
}
