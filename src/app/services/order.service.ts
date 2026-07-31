import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, Timestamp, limit, getDocs } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private firestore: Firestore, private auth: AuthService) {}

  getOrders(): Observable<any[]> {
    const ordersRef = collection(this.firestore, 'orders');
    const user = this.auth.user();
    
    if (user) {
       const q = query(ordersRef, where('buyerId', '==', user.uid));
       return from(getDocs(q)).pipe(
         map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
       );
    }
    
    return from(getDocs(query(ordersRef, limit(1000)))).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
  }

  async addOrder(order: any) {
    const ordersRef = collection(this.firestore, 'orders');
    
    const user = this.auth.user();
    order.buyerId = user ? user.uid : 'anonymous_buyer';
    order.createdAt = Timestamp.now();
    order.status = 'To Ship';
    
    await addDoc(ordersRef, order);
  }
}
