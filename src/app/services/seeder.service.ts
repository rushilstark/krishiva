import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, addDoc, Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class SeederService {
  private firestore: Firestore = inject(Firestore);

  async seedData() {
    await this.seedProducts();
    await this.seedOrders();
  }

  private async seedProducts() {
    const productsCollection = collection(this.firestore, 'products');
    const snapshot = await getDocs(productsCollection);
    
    if (snapshot.empty) {
      console.log('Seeding products...');
      const products = [
        {
          name: 'Organic Palak (Spinach)',
          category: 'Leafy Greens',
          price: 40,
          unit: 'bunch',
          rating: 4.8,
          isOrganic: true,
          imageUrl: '🥬',
          description: 'Fresh organic spinach leaves.',
          sellerId: 'seller-1',
          sellerName: 'Amrutham Farms',
          sellerLocation: 'Bandlaguda Jagir',
          status: 'available'
        },
        {
          name: 'Beerakaya (Ridge Gourd)',
          category: 'Gourd',
          price: 60,
          unit: 'kg',
          rating: 4.5,
          isOrganic: true,
          imageUrl: '🥒',
          description: 'Tender ridge gourd from local farms.',
          sellerId: 'seller-2',
          sellerName: 'Green Meadows',
          sellerLocation: 'Kismatpur',
          status: 'available'
        },
        {
          name: 'Goru Chikkudu (Cluster Beans)',
          category: 'Vegetables',
          price: 50,
          unit: 'kg',
          rating: 4.6,
          isOrganic: true,
          imageUrl: '🫛',
          description: 'Farm fresh cluster beans.',
          sellerId: 'seller-3',
          sellerName: 'Tarkari Organics',
          sellerLocation: 'Bandlaguda Jagir',
          status: 'available'
        },
        {
          name: 'Desi Tomatoes',
          category: 'Vegetables',
          price: 80,
          unit: 'kg',
          rating: 4.9,
          isOrganic: true,
          imageUrl: '🍅',
          description: 'Juicy country tomatoes.',
          sellerId: 'seller-1',
          sellerName: 'Amrutham Farms',
          sellerLocation: 'Bandlaguda Jagir',
          status: 'available'
        },
        {
          name: 'Organic Potatoes',
          category: 'Root',
          price: 45,
          unit: 'kg',
          rating: 4.7,
          isOrganic: true,
          imageUrl: '🥔',
          description: 'Fresh organic potatoes.',
          sellerId: 'seller-2',
          sellerName: 'Green Meadows',
          sellerLocation: 'Kismatpur',
          status: 'available'
        },
        {
          name: 'Fresh A2 Cow Milk',
          category: 'Dairy',
          price: 80,
          unit: 'litre',
          rating: 4.9,
          isOrganic: true,
          imageUrl: '🥛',
          description: 'Pure A2 cow milk from farm.',
          sellerId: 'seller-1',
          sellerName: 'Amrutham Farms',
          sellerLocation: 'Bandlaguda Jagir',
          status: 'available'
        },
        {
          name: 'Organic Carrots',
          category: 'Root',
          price: 55,
          unit: 'kg',
          rating: 4.6,
          isOrganic: true,
          imageUrl: '🥕',
          description: 'Crunchy organic carrots.',
          sellerId: 'seller-3',
          sellerName: 'Tarkari Organics',
          sellerLocation: 'Kismatpur',
          status: 'available'
        },
        {
          name: 'Farm Fresh Eggs',
          category: 'Dairy',
          price: 90,
          unit: 'dozen',
          rating: 4.8,
          isOrganic: true,
          imageUrl: '🥚',
          description: 'Fresh free-range eggs.',
          sellerId: 'seller-2',
          sellerName: 'Green Meadows',
          sellerLocation: 'Bandlaguda Jagir',
          status: 'available'
        }
      ];

      for (const product of products) {
        await addDoc(productsCollection, {
          ...product,
          createdAt: Timestamp.now()
        });
      }
      console.log('Products seeded successfully.');
    }
  }

  private async seedOrders() {
    const ordersCollection = collection(this.firestore, 'orders');
    const snapshot = await getDocs(ordersCollection);
    
    if (snapshot.empty) {
      console.log('Seeding orders...');
      const orders = [
        {
          buyerId: 'demo-buyer',
          items: [
            { productId: 'prod-1', name: 'Organic Palak (Spinach)', price: 40, quantity: 2 },
            { productId: 'prod-4', name: 'Desi Tomatoes', price: 80, quantity: 1 }
          ],
          totalAmount: 160,
          status: 'Delivered'
        },
        {
          buyerId: 'demo-buyer',
          items: [
            { productId: 'prod-6', name: 'Fresh A2 Cow Milk', price: 80, quantity: 2 }
          ],
          totalAmount: 160,
          status: 'Shipped'
        },
        {
          buyerId: 'demo-buyer',
          items: [
            { productId: 'prod-2', name: 'Beerakaya (Ridge Gourd)', price: 60, quantity: 1 },
            { productId: 'prod-7', name: 'Organic Carrots', price: 55, quantity: 2 }
          ],
          totalAmount: 170,
          status: 'To Ship'
        }
      ];

      for (const order of orders) {
        await addDoc(ordersCollection, {
          ...order,
          createdAt: Timestamp.now()
        });
      }
      console.log('Orders seeded successfully.');
    }
  }
}
