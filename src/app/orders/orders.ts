import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="header">
        <h1>Orders</h1>
      </div>

      <div class="tabs">
        <button 
          class="tab" 
          [class.active]="activeTab() === 'All'"
          (click)="setTab('All')">All</button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'To Ship'"
          (click)="setTab('To Ship')">To Ship</button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'Shipped'"
          (click)="setTab('Shipped')">Shipped</button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'Delivered'"
          (click)="setTab('Delivered')">Delivered</button>
      </div>

      <div class="content">
        @if (isLoading()) {
          <div class="loading">Loading orders...</div>
        } @else if (filteredOrders().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🧾</div>
            <h3>No orders yet</h3>
            <p>Orders placed will appear here.</p>
          </div>
        } @else {
          <div class="order-list">
            @for (order of filteredOrders(); track order.id) {
              <div class="order-card">
                <div class="order-header">
                  <div class="order-id">Order #{{ truncateId(order.id) }}</div>
                  <div class="status-badge" [ngClass]="getStatusClass(order.status)">
                    {{ order.status }}
                  </div>
                </div>
                
                <div class="order-date">{{ order.createdAt | date:'mediumDate' }}</div>
                
                <div class="order-items">
                  @for (item of order.items; track item.id) {
                    <div class="item-row">
                      <span class="item-name">{{ item.name }} x {{ item.quantity }}</span>
                      <span class="item-price">₹{{ item.price * item.quantity }}</span>
                    </div>
                  }
                </div>
                
                <div class="order-footer">
                  <span class="total-label">Total Amount</span>
                  <span class="total-amount">₹{{ order.totalAmount }}</span>
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
      border-bottom: 1px solid var(--light-border);
    }
    
    h1 {
      margin: 0;
      font-size: 20px;
      color: var(--text-dark);
    }

    .tabs {
      display: flex;
      background-color: var(--white);
      padding: 10px 10px 0;
      border-bottom: 1px solid var(--light-border);
      overflow-x: auto;
    }

    .tab {
      flex: 1;
      padding: 12px 10px;
      background: none;
      border: none;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-gray);
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
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

    .order-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .order-card {
      background-color: var(--white);
      border-radius: var(--card-radius);
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      border: 1px solid var(--light-border);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
    }

    .order-id {
      font-weight: 600;
      color: var(--text-dark);
      font-size: 15px;
    }

    .status-badge {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 500;
    }
    
    .status-toship { background-color: #fff3cd; color: #856404; }
    .status-shipped { background-color: #cce5ff; color: #004085; }
    .status-delivered { background-color: var(--primary-light); color: var(--primary-dark); }
    .status-default { background-color: #f1f3f5; color: var(--text-gray); }

    .order-date {
      font-size: 13px;
      color: var(--text-gray);
      margin-bottom: 15px;
    }

    .order-items {
      border-top: 1px dashed var(--light-border);
      border-bottom: 1px dashed var(--light-border);
      padding: 10px 0;
      margin-bottom: 10px;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 14px;
      color: var(--text-dark);
    }
    
    .item-row:last-child {
      margin-bottom: 0;
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
    }

    .total-label {
      font-weight: 500;
      color: var(--text-dark);
    }

    .total-amount {
      font-weight: 700;
      color: var(--primary-green);
      font-size: 16px;
    }
  `]
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  orders = signal<any[]>([]);
  activeTab = signal<string>('All');
  isLoading = signal<boolean>(true);

  filteredOrders = computed(() => {
    const tab = this.activeTab();
    const all = this.orders();
    if (tab === 'All') return all;
    return all.filter(o => o.status === tab);
  });

  ngOnInit() {
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching orders', err);
        this.isLoading.set(false);
      }
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  truncateId(id: string): string {
    if (!id) return '';
    return id.substring(0, 8).toUpperCase();
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'to ship': return 'status-toship';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      default: return 'status-default';
    }
  }
}
