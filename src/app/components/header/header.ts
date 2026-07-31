import { Component, Input } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { MenuService } from '../../services/menu';
import { SideMenuComponent } from '../../side-menu/side-menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, SideMenuComponent],
  template: `
    <header class="app-header">
      <button class="icon-btn" (click)="goBack()" *ngIf="showBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      <!-- Hamburger Menu for main screens -->
      <button class="icon-btn" (click)="menu.toggle()" *ngIf="!showBack && showLogo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>

      <h2 class="title" [class.centered]="showBack">{{title}}</h2>
      <div class="header-actions">
        <ng-content></ng-content>
      </div>
    </header>

    <app-side-menu></app-side-menu>
  `,
  styles: [`
    .app-header {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      background: var(--white);
      position: sticky;
      top: 0;
      z-index: 100;
      min-height: 64px;
    }
    .icon-btn {
      background: none; border: none; cursor: pointer; color: var(--text-dark);
      padding: 8px; margin-right: 12px; margin-left: -8px;
    }
    .title {
      font-size: 18px; font-weight: 600; flex: 1;
    }
    .title.centered { text-align: center; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
  `]
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() showBack: boolean = true;
  @Input() showLogo: boolean = false; // Used to show hamburger menu instead of back button

  constructor(private location: Location, public menu: MenuService) {}

  goBack() {
    this.location.back();
  }
}
