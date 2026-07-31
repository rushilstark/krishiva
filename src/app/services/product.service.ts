import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, query, where, addDoc, deleteDoc, Timestamp, limit, getDocs, getDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private firestore: Firestore = inject(Firestore);

  getProducts(): Observable<any[]> {
    const productsRef = collection(this.firestore, 'products');
    const q = query(productsRef, limit(1000));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
  }

  getProductById(id: string): Observable<any> {
    const productDoc = doc(this.firestore, `products/${id}`);
    return from(getDoc(productDoc)).pipe(
      map(snapshot => ({ id: snapshot.id, ...snapshot.data() }))
    );
  }

  getProductsBySeller(sellerId: string): Observable<any[]> {
    const productsRef = collection(this.firestore, 'products');
    const q = query(productsRef, where('sellerId', '==', sellerId));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
  }

  getProductsByCategory(category: string): Observable<any[]> {
    const productsRef = collection(this.firestore, 'products');
    const q = query(productsRef, where('category', '==', category));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
  }

  async addProduct(product: any): Promise<void> {
    const productsRef = collection(this.firestore, 'products');
    const productWithTimestamp = {
      ...product,
      createdAt: Timestamp.now()
    };
    await addDoc(productsRef, productWithTimestamp);
  }

  async deleteProduct(id: string): Promise<void> {
    const productDoc = doc(this.firestore, `products/${id}`);
    await deleteDoc(productDoc);
  }
}
