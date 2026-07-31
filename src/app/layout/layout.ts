import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from '../components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, BottomNavComponent],
  template: `
    <router-outlet></router-outlet>
    <app-bottom-nav></app-bottom-nav>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--bg-color);
      padding-bottom: 70px; /* space for bottom nav */
    }
  `]
})
export class Layout {}
