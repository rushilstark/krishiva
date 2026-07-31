import { Routes } from '@angular/router';
import { Splash } from './splash/splash';
import { RoleSelection } from './role-selection/role-selection';
import { Layout } from './layout/layout';
import { HomeComponent } from './home/home';
import { MarketComponent } from './market/market';
import { ProductDetailsComponent } from './product-details/product-details';
import { OrdersComponent } from './orders/orders';
import { ProfileComponent } from './profile/profile';
import { Onboarding } from './onboarding/onboarding';
import { Login } from './login/login';
import { AddProduct } from './add-product/add-product';
import { MyProductsComponent } from './my-products/my-products';
import { Learn } from './learn/learn';
import { buyerGuard } from './guards/buyer.guard';
import { farmerGuard } from './guards/farmer.guard';

export const routes: Routes = [
  { path: '', component: Splash },
  { path: 'onboarding', component: Onboarding },
  { path: 'login', component: Login },
  { path: 'role-selection', component: RoleSelection },
  { 
    path: '', 
    component: Layout,
    children: [
      { path: 'home', component: HomeComponent, canActivate: [buyerGuard] },
      { path: 'market', component: MarketComponent, canActivate: [buyerGuard] },
      { path: 'product/:id', component: ProductDetailsComponent },
      { path: 'orders', component: OrdersComponent, canActivate: [buyerGuard] },
      { path: 'profile', component: ProfileComponent },
      { path: 'add-product', component: AddProduct, canActivate: [farmerGuard] },
      { path: 'my-products', component: MyProductsComponent, canActivate: [farmerGuard] },
      { path: 'learn', component: Learn, canActivate: [buyerGuard] }
    ]
  },
  { path: '**', redirectTo: '' }
];
