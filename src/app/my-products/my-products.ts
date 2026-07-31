import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-my-products',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="header">
        <h1>My Products</h1>
        <button class="add-btn" (click)="navigateToAdd()">+ Add</button>
      </div>

      <div class="tabs">
        <button 
          class="tab" 
          [class.active]="activeTab() === 'All'"
          (click)="setTab('All')">All</button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'Active'"
          (click)="setTab('Active')">Active</button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'Inactive'"
          (click)="setTab('Inactive')">Inactive</button>
      </div>

      <div class="content">
        @if (isLoading()) {
          <div class="loading">Loading products...</div>
        } @else if (filteredProducts().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <h3>No products yet</h3>
            <p>Tap + Add to create your first product</p>
          </div>
        } @else {
          <div class="product-list">
            @for (product of filteredProducts(); track product.id) {
              <div class="product-card">
                <div class="product-image">{{ product.imageUrl }}</div>
                <div class="product-details">
                  <div class="product-header">
                    <h3>{{ product.name }}</h3>
                    <span class="status-badge" [class.active-status]="product.status === 'Active'">
                      {{ product.status }}
                    </span>
                  </div>
                  <div class="product-price">₹{{ product.price }}/{{ product.unit }}</div>
                  <div class="product-actions">
                    <button class="edit-btn">✏️ Edit</button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 480px;
      margin: 0 auto;
      background-color: var(--bg-color);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .header {
      padding: 20px;
      background-color: var(--white);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--light-border);
    }
    
    h1 {
      margin: 0;
      font-size: 20px;
      color: var(--text-dark);
    }
    
    .add-btn {
      background-color: var(--primary-green);
      color: var(--white);
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      cursor: pointer;
    }

    .tabs {
      display: flex;
      background-color: var(--white);
      padding: 10px 20px 0;
      border-bottom: 1px solid var(--light-border);
    }

    .tab {
      flex: 1;
      padding: 12px 0;
      background: none;
      border: none;
      font-size: 15px;
      font-weight: 500;
      color: var(--text-gray);
      border-bottom: 2px solid transparent;
      cursor: pointer;
    }

    .tab.active {
      color: var(--primary-green);
      border-bottom-color: var(--primary-green);
    }

    .content {
      padding: 20px;
      flex: 1;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-gray);
    }
    
    .empty-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    
    .empty-state h3 {
      color: var(--text-dark);
      margin: 0 0 8px 0;
    }

    .product-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .product-card {
      background-color: var(--white);
      border-radius: var(--card-radius);
      padding: 15px;
      display: flex;
      gap: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      border: 1px solid var(--light-border);
    }

    .product-image {
      width: 70px;
      height: 70px;
      background-color: var(--primary-light);
      border-radius: var(--border-radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
    }

    .product-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 5px;
    }

    .product-header h3 {
      margin: 0;
      font-size: 16px;
      color: var(--text-dark);
    }

    .status-badge {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 12px;
      background-color: #f1f3f5;
      color: var(--text-gray);
    }

    .status-badge.active-status {
      background-color: var(--primary-light);
      color: var(--primary-dark);
    }

    .product-price {
      font-weight: 600;
      color: var(--primary-green);
      font-size: 15px;
      margin-bottom: 10px;
    }

    .product-actions {
      display: flex;
      justify-content: flex-end;
    }

    .edit-btn {
      background: none;
      border: 1px solid var(--light-border);
      padding: 6px 12px;
      border-radius: 15px;
      font-size: 13px;
      color: var(--text-dark);
      cursor: pointer;
    }
  `]
})
export class MyProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);

  products = signal<any[]>([]);
  activeTab = signal<string>('All');
  isLoading = signal<boolean>(true);

  filteredProducts = computed(() => {
    const tab = this.activeTab();
    const all = this.products();
    if (tab === 'All') return all;
    return all.filter(p => p.status === tab);
  });

  ngOnInit() {
    this.productService.getProducts().subscribe({
      next: (data) => {
        // Assume filtering for current user happens in service or here.
        // For now, just load all products fetched.
        this.products.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.isLoading.set(false);
      }
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  navigateToAdd() {
    this.router.navigate(['/add-product']);
  }
}
