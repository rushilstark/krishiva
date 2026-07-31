import { Injectable, signal } from '@angular/core';
import { Auth, signInAnonymously, onAuthStateChanged, User } from '@angular/fire/auth';

export type Role = 'farmer' | 'buyer' | null;

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<User | null>(null);
  role = signal<Role>(null);

  constructor(private auth: Auth) {
    this.loadRole();
    
    onAuthStateChanged(this.auth, (user) => {
      this.user.set(user);
    });
  }

  async login(selectedRole: Role) {
    try {
      await signInAnonymously(this.auth);
    } catch (error) {
      console.warn('Firebase Auth bypassed locally due to fake API keys:', error);
    }
    
    this.role.set(selectedRole);
    localStorage.setItem('krishiva_role', selectedRole || '');
  }

  logout() {
    this.auth.signOut().catch(() => {});
    this.role.set(null);
    localStorage.removeItem('krishiva_role');
  }

  private loadRole() {
    const savedRole = localStorage.getItem('krishiva_role') as Role;
    if (savedRole) {
      this.role.set(savedRole);
    }
  }
}
