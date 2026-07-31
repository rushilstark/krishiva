import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="header">
        <h1>Profile</h1>
      </div>

      <div class="profile-header">
        <div class="avatar">
          {{ authService.role() === 'farmer' ? '👨‍🌾' : '🛒' }}
        </div>
        <div class="user-info">
          <h2>{{ authService.user()?.displayName || 'User' }}</h2>
          <p>{{ authService.user()?.email || 'user@example.com' }}</p>
          <span class="role-badge">{{ authService.role() | titlecase }} Account</span>
        </div>
      </div>

      <div class="menu-list">
        <div class="menu-item">
          <span class="menu-icon">📍</span>
          <span class="menu-text">My Addresses</span>
          <span class="chevron">›</span>
        </div>
        <div class="menu-item">
          <span class="menu-icon">💳</span>
          <span class="menu-text">Payment Methods</span>
          <span class="chevron">›</span>
        </div>
        <div class="menu-item">
          <span class="menu-icon">⭐</span>
          <span class="menu-text">My Reviews</span>
          <span class="chevron">›</span>
        </div>
        <div class="menu-item">
          <span class="menu-icon">🎧</span>
          <span class="menu-text">Help & Support</span>
          <span class="chevron">›</span>
        </div>
        <div class="menu-item">
          <span class="menu-icon">ℹ️</span>
          <span class="menu-text">About Krishiva</span>
          <span class="chevron">›</span>
        </div>
      </div>

      <button class="logout-btn" (click)="onLogout()">
        <span class="menu-icon">🚪</span> Logout
      </button>
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
    }
    
    h1 {
      margin: 0;
      font-size: 24px;
      color: var(--text-dark);
    }

    .profile-header {
      background-color: var(--white);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 15px;
      border-bottom: 1px solid var(--light-border);
    }

    .avatar {
      width: 80px;
      height: 80px;
      background-color: var(--primary-light);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }

    .user-info {
      flex: 1;
    }

    .user-info h2 {
      margin: 0 0 4px 0;
      font-size: 20px;
      color: var(--text-dark);
    }

    .user-info p {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: var(--text-gray);
    }

    .role-badge {
      display: inline-block;
      background-color: var(--primary-green);
      color: var(--white);
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 500;
    }

    .menu-list {
      background-color: var(--white);
      border-top: 1px solid var(--light-border);
      border-bottom: 1px solid var(--light-border);
      margin-bottom: 20px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--light-border);
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .menu-item:last-child {
      border-bottom: none;
    }

    .menu-item:hover {
      background-color: var(--bg-color);
    }

    .menu-icon {
      font-size: 20px;
      margin-right: 15px;
    }

    .menu-text {
      flex: 1;
      font-size: 16px;
      color: var(--text-dark);
      font-weight: 500;
    }

    .chevron {
      color: var(--text-gray);
      font-size: 20px;
      font-weight: 300;
    }

    .logout-btn {
      margin: 0 20px;
      padding: 16px;
      background-color: #fff0f0;
      color: #dc3545;
      border: 1px solid #ffdfdf;
      border-radius: var(--border-radius);
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .logout-btn:hover {
      background-color: #ffe5e5;
    }
  `]
})
export class ProfileComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
