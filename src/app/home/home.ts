import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../services/product.service';
import { MenuService } from '../services/menu';
import { CartService } from '../services/cart';
import { ProductCardComponent } from '../components/product-card/product-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
    <div class="home-container">
      <header class="header">
        <button class="menu-btn" (click)="toggleMenu()">☰</button>
        <h1 class="logo">Krishiva</h1>
        <div class="cart-icon" routerLink="/cart">
          🛒
          <span class="badge" *ngIf="cartCount() > 0">{{ cartCount() }}</span>
        </div>
      </header>

      <div class="search-section">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Search organic products...">
        </div>
      </div>

      <div class="promo-banner">
        <div class="promo-content">
          <h2>Fresh Organic Farm Produce</h2>
          <p>Directly from farmers to your kitchen</p>
          <a routerLink="/market" class="shop-now-btn">Shop Now</a>
        </div>
      </div>

      <div class="categories-section">
        <h3 class="section-title">Categories</h3>
        <div class="categories-scroll">
          <div class="category-item" *ngFor="let cat of categories">
            <div class="cat-icon">{{ cat.emoji }}</div>
            <span class="cat-name">{{ cat.name }}</span>
          </div>
        </div>
      </div>

      <div class="featured-section">
        <div class="section-header">
          <h3 class="section-title">Featured Products</h3>
          <a routerLink="/market" class="see-all">See All</a>
        </div>
        <div class="product-grid" *ngIf="!loading(); else loader">
          <app-product-card 
            *ngFor="let product of featuredProducts()" 
            [product]="product"
            (add)="addToCart($event)">
          </app-product-card>
        </div>
        <ng-template #loader>
          <div class="loading">Loading featured products...</div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      background: var(--bg-color);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding-bottom: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: var(--white);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .menu-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-dark);
    }
    .logo {
      margin: 0;
      color: var(--primary-green);
      font-size: 1.5rem;
      font-weight: 700;
    }
    .cart-icon {
      position: relative;
      font-size: 1.5rem;
      cursor: pointer;
      text-decoration: none;
    }
    .badge {
      position: absolute;
      top: -5px;
      right: -8px;
      background: #e53935;
      color: white;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 10px;
      font-weight: bold;
    }
    .search-section {
      padding: 16px;
      background: var(--white);
    }
    .search-bar {
      display: flex;
      align-items: center;
      background: var(--bg-color);
      padding: 12px 16px;
      border-radius: var(--border-radius);
      border: 1px solid var(--light-border);
    }
    .search-icon {
      margin-right: 8px;
      color: var(--text-gray);
    }
    .search-bar input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 1rem;
    }
    .promo-banner {
      margin: 16px;
      background: linear-gradient(135deg, var(--primary-green), var(--primary-dark));
      border-radius: var(--card-radius);
      padding: 24px;
      color: var(--white);
      position: relative;
      overflow: hidden;
    }
    .promo-content {
      position: relative;
      z-index: 1;
    }
    .promo-content h2 {
      margin: 0 0 8px 0;
      font-size: 1.5rem;
    }
    .promo-content p {
      margin: 0 0 16px 0;
      opacity: 0.9;
    }
    .shop-now-btn {
      display: inline-block;
      background: var(--white);
      color: var(--primary-green);
      padding: 10px 20px;
      border-radius: 20px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .categories-section {
      padding: 16px 0;
      background: var(--white);
    }
    .section-title {
      margin: 0 0 16px 16px;
      color: var(--text-dark);
      font-size: 1.2rem;
    }
    .categories-scroll {
      display: flex;
      gap: 16px;
      padding: 0 16px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .categories-scroll::-webkit-scrollbar {
      display: none;
    }
    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      min-width: 70px;
    }
    .cat-icon {
      width: 60px;
      height: 60px;
      background: var(--primary-light);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }
    .cat-name {
      font-size: 0.85rem;
      color: var(--text-dark);
      font-weight: 500;
    }
    .featured-section {
      padding: 16px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .section-header .section-title {
      margin: 0;
    }
    .see-all {
      color: var(--primary-green);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .loading {
      text-align: center;
      padding: 20px;
      color: var(--text-gray);
    }
  `]
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private menuService = inject(MenuService);
  private cartService = inject(CartService);

  cartCount = this.cartService.cartCount;
  
  categories = [
    { name: 'Vegetables', emoji: '🥦' },
    { name: 'Fruits', emoji: '🍎' },
    { name: 'Millets', emoji: '🌾' },
    { name: 'Dairy', emoji: '🥛' },
    { name: 'Leafy', emoji: '🥬' }
  ];

  featuredProducts = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.productService.getProducts().subscribe(prods => {
      this.featuredProducts.set(prods.slice(0, 4));
      this.loading.set(false);
    });
  }

  toggleMenu() {
    this.menuService.toggle();
  }

  addToCart(product: any) {
    this.cartService.addToCart(product);
  }
}
