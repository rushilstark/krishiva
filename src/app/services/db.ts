import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DbService {
  private productsSubject = new BehaviorSubject<any[]>([]);
  private ordersSubject = new BehaviorSubject<any[]>([]);
  private categoriesSubject = new BehaviorSubject<any[]>([
    { id: '1', name: 'Vegetables', icon: '🥦' },
    { id: '2', name: 'Fruits', icon: '🍎' },
    { id: '3', name: 'Millets', icon: '🌾' },
    { id: '4', name: 'Dairy', icon: '🥛' },
    { id: '5', name: 'More', icon: '⋯' }
  ]);

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
    const currentProducts = this.productsSubject.value;
    if (currentProducts.length === 0) {
      this.productsSubject.next([
        { id: 'p1', name: 'Organic Tomatoes', type: 'Fresh & Pesticide Free', category: 'Vegetables', price: '₹40 / kg', rating: 4.8, reviews: 120, image: '🍅', tag: '100% Organic', description: 'Grown naturally without any chemical fertilizers.', seller: { name: 'Green Valley Farms', location: 'Hyderabad, India', rating: 4.9, image: '👨‍🌾' } },
        { id: 'p2', name: 'Organic Spinach', type: 'Fresh & Pesticide Free', category: 'Leafy Greens', price: '₹30 / bunch', rating: 4.8, reviews: 85, image: '🥬', tag: '100% Organic', description: 'Rich in iron and vitamins.', seller: { name: 'Green Valley Farms', location: 'Hyderabad, India', rating: 4.9, image: '👨‍🌾' } },
        { id: 'p3', name: 'Organic Carrots', type: 'Farm Fresh', category: 'Root', price: '₹40 / kg', rating: 4.7, reviews: 92, image: '🥕', tag: '100% Organic', description: 'Crunchy and sweet carrots directly from the farm.', seller: { name: 'Sunrise Farms', location: 'Pune, India', rating: 4.6, image: '👩‍🌾' } },
        { id: 'p4', name: 'Organic Broccoli', type: 'Chemical Free', category: 'Vegetables', price: '₹80 / kg', rating: 4.9, reviews: 45, image: '🥦', tag: '100% Organic', description: 'Fresh broccoli heads.', seller: { name: 'Sunrise Farms', location: 'Pune, India', rating: 4.6, image: '👩‍🌾' } },
        { id: 'p5', name: 'Organic Cabbage', type: 'Fresh & Healthy', category: 'Vegetables', price: '₹25 / kg', rating: 4.6, reviews: 30, image: '🥬', tag: '100% Organic', description: 'Crisp green cabbage.', seller: { name: 'Green Valley Farms', location: 'Hyderabad, India', rating: 4.9, image: '👨‍🌾' } },
        { id: 'p6', name: 'Organic Eggs', type: 'Free Range', category: 'Dairy', price: '₹120 / dozen', rating: 4.8, reviews: 150, image: '🥚', tag: '100% Organic', description: 'Free range organic eggs.', seller: { name: 'Happy Hens Farm', location: 'Bangalore, India', rating: 4.8, image: '👨‍🌾' } },
        { id: 'p7', name: 'Organic Milk', type: 'A2 Cow Milk', category: 'Dairy', price: '₹80 / L', rating: 4.9, reviews: 200, image: '🥛', tag: '100% Organic', description: 'Fresh A2 cow milk.', seller: { name: 'Happy Hens Farm', location: 'Bangalore, India', rating: 4.8, image: '👨‍🌾' } },
        { id: 'p8', name: 'Organic Potatoes', type: 'Farm Fresh', category: 'Root', price: '₹35 / kg', rating: 4.5, reviews: 110, image: '🥔', tag: '100% Organic', description: 'Versatile and fresh potatoes.', seller: { name: 'Sunrise Farms', location: 'Pune, India', rating: 4.6, image: '👩‍🌾' } }
      ]);
    }

    const currentOrders = this.ordersSubject.value;
    if (currentOrders.length === 0) {
      this.ordersSubject.next([
        { id: '#CRD12345', date: '12 May 2024', status: 'To Ship', items: 'Organic Tomatoes (2 kg)', total: '₹80', image: '🍅' },
        { id: '#CRD12344', date: '10 May 2024', status: 'Shipped', items: 'Organic Spinach (1 bunch)', total: '₹30', image: '🥬' },
        { id: '#CRD12343', date: '8 May 2024', status: 'Delivered', items: 'Organic Eggs (1 dozen)', total: '₹120', image: '🥚' }
      ]);
    }
  }

  getCategories(): Observable<any[]> { return this.categoriesSubject.asObservable(); }
  getProducts(): Observable<any[]> { return this.productsSubject.asObservable(); }
  getOrders(): Observable<any[]> { return this.ordersSubject.asObservable(); }
  
  getProductById(id: string): Observable<any> {
    return new Observable(sub => {
      const prods = this.productsSubject.value;
      sub.next(prods.find(p => p.id === id));
      sub.complete();
    });
  }

  addProduct(product: any) {
    const current = this.productsSubject.value;
    product.id = 'p' + (current.length + 1);
    product.rating = 0;
    product.reviews = 0;
    product.tag = '100% Organic';
    product.seller = { name: 'Shiv Choudary (You)', location: 'Your Farm', rating: 5.0, image: '👨‍🌾' };
    
    if (!product.image) {
      if (product.name.toLowerCase().includes('apple')) product.image = '🍎';
      else if (product.name.toLowerCase().includes('milk')) product.image = '🥛';
      else product.image = '🌿';
    }

    this.productsSubject.next([product, ...current]);
  }

  addOrder(order: any) {
    const current = this.ordersSubject.value;
    order.id = '#CRD' + Math.floor(10000 + Math.random() * 90000);
    const today = new Date();
    order.date = today.getDate() + ' ' + today.toLocaleString('default', { month: 'short' }) + ' ' + today.getFullYear();
    order.status = 'To Ship';
    
    this.ordersSubject.next([order, ...current]);
  }
}
