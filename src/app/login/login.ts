import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="header">
        <button class="icon-btn" (click)="goBack()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      <div class="welcome-text">
        <h1>Welcome Back!</h1>
        <p>Login to continue to Krishiva</p>
      </div>

      <form class="login-form">
        <div class="input-group">
          <span class="input-icon">✉️</span>
          <input type="text" placeholder="Email or Phone" />
        </div>
        <div class="input-group">
          <span class="input-icon">🔒</span>
          <input type="password" placeholder="Password" />
        </div>
        <div class="forgot-pwd">
          <a href="#">Forgot Password?</a>
        </div>

        <button type="button" class="btn-primary" (click)="login()">Login</button>
      </form>

      <div class="divider">
        <span>or continue with</span>
      </div>

      <div class="social-login">
        <button class="social-btn" style="color: #DB4437;">G</button>
        <button class="social-btn" style="color: #4267B2;">f</button>
        <button class="social-btn" style="color: #000;"></button>
      </div>

      <p class="signup-text">
        Don't have an account? <a href="#">Sign Up</a>
      </p>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex; flex-direction: column; padding: 24px; height: 100vh; background: var(--white);
    }
    .header { margin-bottom: 32px; margin-left: -8px; }
    .icon-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-dark); }
    
    .welcome-text h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; color: var(--text-dark); }
    .welcome-text p { font-size: 14px; color: var(--text-gray); margin-bottom: 32px; }

    .login-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px; }
    .input-group {
      display: flex; align-items: center; border: 1px solid var(--light-border);
      border-radius: var(--border-radius); padding: 12px 16px; background: #F8F9FA;
    }
    .input-icon { margin-right: 12px; font-size: 18px; color: var(--text-gray); }
    .input-group input {
      border: none; background: transparent; outline: none; flex: 1; font-size: 15px; font-family: 'Inter', sans-serif;
    }
    .forgot-pwd { text-align: right; }
    .forgot-pwd a { font-size: 13px; color: var(--text-gray); font-weight: 500; }

    .divider {
      text-align: center; margin-bottom: 24px; position: relative;
    }
    .divider span {
      background: var(--white); padding: 0 16px; color: var(--text-gray); font-size: 13px; position: relative; z-index: 1;
    }
    .divider::before {
      content: ''; position: absolute; left: 0; top: 50%; width: 100%; height: 1px; background: var(--light-border); z-index: 0;
    }

    .social-login {
      display: flex; justify-content: center; gap: 16px; margin-bottom: auto;
    }
    .social-btn {
      width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--light-border);
      background: var(--white); font-size: 20px; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; color: var(--text-dark);
    }
    
    .signup-text {
      text-align: center; font-size: 14px; color: var(--text-gray); margin-top: 24px;
    }
    .signup-text a { color: var(--primary-green); font-weight: 600; }
  `]
})
export class Login {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/onboarding']);
  }

  login() {
    this.router.navigate(['/role-selection']);
  }
}
