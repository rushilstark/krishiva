import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MenuService {
  isMenuOpen = signal(false);

  toggle() {
    this.isMenuOpen.update(v => !v);
  }

  close() {
    this.isMenuOpen.set(false);
  }
}
