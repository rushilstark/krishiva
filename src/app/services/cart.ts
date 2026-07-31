import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private _items = signal<any[]>([]);

  // Computed signals
  readonly cartCount = computed(() => this._items().length);
  readonly cartTotal = computed(() => {
    return this._items().reduce((total, item) => total + (item.price || 0), 0);
  });

  get items() {
    return this._items;
  }

  addToCart(product: any) {
    this._items.update(items => [...items, product]);
    this.showToast(`${product.name} added to cart!`);
  }

  removeFromCart(index: number) {
    this._items.update(items => {
      const newItems = [...items];
      newItems.splice(index, 1);
      return newItems;
    });
  }

  clearCart() {
    this._items.set([]);
  }

  getCart() {
    return this._items();
  }

  private showToast(message: string) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'var(--primary-dark)';
    toast.style.color = 'var(--white)';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = 'var(--border-radius)';
    toast.style.zIndex = '1000';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    toast.style.transition = 'opacity 0.3s';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}
