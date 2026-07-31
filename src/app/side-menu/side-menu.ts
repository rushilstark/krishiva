import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { MenuService } from '../services/menu';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="overlay" *ngIf="menu.isMenuOpen()" (click)="menu.close()"></div>
    <div class="drawer" [class.open]="menu.isMenuOpen()">
      <div class="drawer-header">
        <div class="logo-row">
          <img src="/splash.jpg" class="logo" alt="Krishiva Logo" />
          <div>
            <h3>Krishiva</h3>
            <p>Go Organic, Live Healthy</p>
          </div>
        </div>
      </div>
      
      <div class="drawer-content">
        <a *ngIf="auth.role() === 'buyer'" routerLink="/home" (click)="menu.close()" class="menu-item"><span class="icon">🏠</span> Home</a>
        <a *ngIf="auth.role() === 'buyer'" routerLink="/market" (click)="menu.close()" class="menu-item"><span class="icon">🏪</span> Marketplace</a>
        <a *ngIf="auth.role() === 'buyer'" routerLink="/orders" (click)="menu.close()" class="menu-item"><span class="icon">📦</span> My Orders</a>
        <a *ngIf="auth.role() === 'buyer'" routerLink="/learn" (click)="menu.close()" class="menu-item"><span class="icon">🧭</span> Learn & Explore</a>
        
        <a *ngIf="auth.role() === 'farmer'" routerLink="/my-products" (click)="menu.close()" class="menu-item"><span class="icon">🌱</span> My Products</a>
        <a *ngIf="auth.role() === 'farmer'" routerLink="/add-product" (click)="menu.close()" class="menu-item"><span class="icon">➕</span> Add Product</a>
        <a *ngIf="auth.role() === 'farmer'" routerLink="/orders" (click)="menu.close()" class="menu-item"><span class="icon">📦</span> My Orders</a>
        
        <a class="menu-item" (click)="menu.close()"><span class="icon">👥</span> Community</a>
        <a class="menu-item" (click)="menu.close()"><span class="icon">💬</span> Messages</a>
        
        <div class="divider"></div>
        
        <a class="menu-item" (click)="menu.close()"><span class="icon">⚙️</span> Settings</a>
        <a class="menu-item" (click)="menu.close()"><span class="icon">❓</span> Help & Support</a>
        <a (click)="logout()" class="menu-item"><span class="icon">🚪</span> Logout</a>
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 2000; }
    .drawer {
      position: fixed; top: 0; left: -280px; width: 280px; height: 100vh;
      background: var(--white); z-index: 2001; transition: left 0.3s ease;
      display: flex; flex-direction: column; box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    }
    .drawer.open { left: 0; }
    .drawer-header {
      background: var(--primary-green); padding: 40px 20px 20px; color: var(--white);
    }
    .logo-row { display: flex; align-items: center; gap: 12px; }
    .logo { width: 40px; height: 40px; border-radius: 50%; background: var(--white); padding: 2px; }
    .drawer-header h3 { font-size: 18px; font-weight: 600; margin-bottom: 2px; }
    .drawer-header p { font-size: 11px; opacity: 0.9; }
    
    .drawer-content { flex: 1; overflow-y: auto; padding: 16px 0; }
    .menu-item {
      display: flex; align-items: center; padding: 14px 24px; color: var(--text-dark);
      font-size: 15px; font-weight: 500; text-decoration: none; cursor: pointer;
    }
    .menu-item:hover { background: #F8F9FA; }
    .menu-item .icon { font-size: 20px; width: 32px; color: var(--text-gray); }
    .divider { height: 1px; background: var(--light-border); margin: 16px 0; }
  `]
})
export class SideMenuComponent {
  constructor(public auth: AuthService, private router: Router, public menu: MenuService) {}

  logout() {
    this.auth.logout();
    this.menu.close();
    this.router.navigate(['/login']);
  }
}
