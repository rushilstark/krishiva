import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, Role } from '../../services/auth';

@Component({
  selector: 'app-bottom-nav',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/home" routerLinkActive="active" class="nav-item">
        <span class="icon">🏠</span><span class="label">Home</span>
      </a>
      <a routerLink="/market" routerLinkActive="active" class="nav-item">
        <span class="icon">🏪</span><span class="label">Market</span>
      </a>
      
      <!-- Buyer specific -->
      <a *ngIf="auth.role() === 'buyer'" routerLink="/orders" routerLinkActive="active" class="nav-item">
        <span class="icon">📦</span><span class="label">Orders</span>
      </a>
      <a *ngIf="auth.role() === 'buyer'" routerLink="/learn" routerLinkActive="active" class="nav-item">
        <span class="icon">🧭</span><span class="label">Learn</span>
      </a>

      <!-- Farmer specific -->
      <a *ngIf="auth.role() === 'farmer'" routerLink="/my-products" routerLinkActive="active" class="nav-item">
        <span class="icon">🌱</span><span class="label">Products</span>
      </a>
      <a *ngIf="auth.role() === 'farmer'" routerLink="/orders" routerLinkActive="active" class="nav-item">
        <span class="icon">📦</span><span class="label">Orders</span>
      </a>

      <a routerLink="/profile" routerLinkActive="active" class="nav-item">
        <span class="icon">👤</span><span class="label">Profile</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed; bottom: 0; width: 100%; max-width: 480px;
      background-color: var(--white); border-top: 1px solid var(--light-border);
      display: flex; justify-content: space-around; padding: 10px 0 20px 0;
      z-index: 1000; box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    }
    .nav-item {
      display: flex; flex-direction: column; align-items: center;
      color: var(--text-gray); font-size: 10px; gap: 4px; text-decoration: none;
    }
    .nav-item.active { color: var(--primary-green); font-weight: 600; }
    .nav-item.active .icon { filter: grayscale(0%); opacity: 1; }
    .nav-item .icon { font-size: 20px; opacity: 0.6; }
  `]
})
export class BottomNavComponent {
  constructor(public auth: AuthService) {}
}
