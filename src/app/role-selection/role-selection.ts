import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-role-selection',
  imports: [CommonModule],
  template: `
    <div class="role-container">
      <div class="header">
        <button class="icon-btn" (click)="goBack()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      <div class="title-text">
        <h1>Choose Your Role</h1>
        <p>Select how you want to continue</p>
      </div>

      <div class="cards-container">
        <!-- Farmer Card -->
        <div class="role-card" (click)="selectRole('farmer')">
          <div class="card-img-container" style="background-color: #E8F5E9;">
             <img src="/farmer.jpg" alt="Farmer" class="card-img"/>
          </div>
          <div class="card-content">
            <h3>I am a Farmer</h3>
            <p>Sell your organic products directly to buyers</p>
          </div>
        </div>

        <!-- Buyer Card -->
        <div class="role-card" (click)="selectRole('buyer')">
          <div class="card-img-container" style="background-color: #FFF3E0;">
             <img src="/buyer.jpg" alt="Buyer" class="card-img"/>
          </div>
          <div class="card-content">
            <h3>I am a Buyer</h3>
            <p>Buy organic products from trusted farmers</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .role-container { display: flex; flex-direction: column; padding: 24px; height: 100vh; background: var(--white); }
    .header { margin-bottom: 32px; margin-left: -8px; }
    .icon-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-dark); }
    
    .title-text h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; color: var(--text-dark); }
    .title-text p { font-size: 14px; color: var(--text-gray); margin-bottom: 40px; }

    .cards-container { display: flex; flex-direction: column; gap: 24px; }
    .role-card {
      display: flex; align-items: center; padding: 16px; border: 1px solid var(--light-border);
      border-radius: var(--card-radius); cursor: pointer; transition: all 0.2s; background: var(--white);
    }
    .role-card:active { transform: scale(0.98); border-color: var(--primary-green); background: var(--primary-light); }
    
    .card-img-container {
      width: 72px; height: 72px; border-radius: 12px; margin-right: 16px; flex-shrink: 0;
      display: flex; justify-content: center; align-items: center; overflow: hidden;
    }
    .card-img { width: 100%; height: 100%; object-fit: cover; }
    
    .card-content h3 { font-size: 16px; font-weight: 600; color: var(--text-dark); margin-bottom: 4px; }
    .card-content p { font-size: 13px; color: var(--text-gray); line-height: 1.4; }
  `]
})
export class RoleSelection {
  constructor(private router: Router, private auth: AuthService) {}

  goBack() {
    this.router.navigate(['/login']);
  }

  async selectRole(role: 'buyer' | 'farmer') {
    await this.auth.login(role);
    if (role === 'buyer') {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/my-products']);
    }
  }
}
