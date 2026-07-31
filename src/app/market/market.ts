import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart';
import { ProductCardComponent } from '../components/product-card/product-card';

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
    <div class="market-container">
      <header class="header">
        <h2>Market</h2>
        <div class="cart-icon" routerLink="/cart">
          🛒
          <span class="badge" *ngIf="cartCount() > 0">{{ cartCount() }}</span>
        </div>
      </header>

      <div class="filters">
        <button *ngFor="let filter of filters" 
                class="filter-chip" 
                [class.active]="activeFilter() === filter"
                (click)="setFilter(filter)">
          {{ filter }}
        </button>
      </div>

      <div class="product-grid" *ngIf="!loading(); else loader">
        <app-product-card 
          *ngFor="let product of filteredProducts()" 
          [product]="product"
          (add)="addToCart($event)">
        </app-product-card>
      </div>
      <div *ngIf="!loading() && filteredProducts().length === 0" class="no-products">
        No products found in this category.
      </div>
      
      <ng-template #loader>
        <div class="loading">Loading products...</div>
      </ng-template>
    </div>
  `,
  styles: [`
    .market-container {
      background: var(--bg-color);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
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
      border-bottom: 1px solid var(--light-border);
    }
    .header h2 {
      margin: 0;
      color: var(--primary-dark);
      font-size: 1.5rem;
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
    .filters {
      display: flex;
      gap: 12px;
      padding: 16px;
      overflow-x: auto;
      scrollbar-width: none;
      background: var(--white);
    }
    .filters::-webkit-scrollbar {
      display: none;
    }
    .filter-chip {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid var(--light-border);
      background: var(--white);
      color: var(--text-gray);
      white-space: nowrap;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .filter-chip.active {
      background: var(--primary-green);
      color: var(--white);
      border-color: var(--primary-green);
    }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      padding: 16px;
    }
    .loading, .no-products {
      padding: 40px 16px;
      text-align: center;
      color: var(--text-gray);
    }
  `]
})
export class MarketComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  cartCount = this.cartService.cartCount;
  
  filters = ['All', 'Leafy Greens', 'Root', 'Gourd', 'Dairy'];
  activeFilter = signal('All');
  products = signal<any[]>([]);
  loading = signal(true);

  filteredProducts = computed(() => {
    const filter = this.activeFilter();
    const allProds = this.products();
    if (filter === 'All') return allProds;
    return allProds.filter(p => p.category === filter);
  });

  ngOnInit() {
    this.productService.getProducts().subscribe(prods => {
      this.products.set(prods);
      this.loading.set(false);
    });
  }

  setFilter(filter: string) {
    this.activeFilter.set(filter);
  }

  addToCart(product: any) {
    this.cartService.addToCart(product);
  }
}
