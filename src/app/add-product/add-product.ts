import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { AuthService } from '../services/auth';
import { HeaderComponent } from '../components/header/header';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <div class="page-container">
      <app-header title="Add Product" [showBack]="true"></app-header>
      
      <div class="content">
        <div class="form-group">
          <label>Select Product Icon</label>
          <div class="emoji-grid">
            @for (emoji of availableEmojis; track emoji) {
              <div 
                class="emoji-option" 
                [class.selected]="selectedEmoji() === emoji"
                (click)="selectEmoji(emoji)">
                {{emoji}}
              </div>
            }
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" #productForm="ngForm" class="product-form">
          <div class="form-group">
            <label for="name">Product Name</label>
            <input type="text" id="name" name="name" [(ngModel)]="formData.name" required placeholder="E.g. Fresh Tomatoes">
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label for="category">Category</label>
              <select id="category" name="category" [(ngModel)]="formData.category" required>
                <option value="" disabled selected>Select</option>
                <option value="Leafy Greens">Leafy Greens</option>
                <option value="Root">Root</option>
                <option value="Gourd">Gourd</option>
                <option value="Dairy">Dairy</option>
                <option value="Vegetables">Vegetables</option>
              </select>
            </div>
            
            <div class="form-group half">
              <label for="isOrganic">Type</label>
              <select id="isOrganic" name="isOrganic" [(ngModel)]="formData.isOrganic" required>
                <option [ngValue]="true">Organic</option>
                <option [ngValue]="false">Conventional</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label for="price">Price (₹)</label>
              <input type="number" id="price" name="price" [(ngModel)]="formData.price" required min="1">
            </div>

            <div class="form-group half">
              <label for="unit">Unit</label>
              <select id="unit" name="unit" [(ngModel)]="formData.unit" required>
                <option value="" disabled selected>Select</option>
                <option value="kg">kg</option>
                <option value="bunch">bunch</option>
                <option value="litre">litre</option>
                <option value="dozen">dozen</option>
                <option value="piece">piece</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" name="description" [(ngModel)]="formData.description" required rows="3" placeholder="Describe your product..."></textarea>
          </div>

          <button type="submit" class="submit-btn" [disabled]="!productForm.form.valid || !selectedEmoji() || isSubmitting()">
            {{ isSubmitting() ? 'Publishing...' : 'Publish Product' }}
          </button>
          
          @if (showSuccess()) {
            <div class="success-message">
              ✅ Product added successfully!
            </div>
          }
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 480px;
      margin: 0 auto;
      background-color: var(--bg-color);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .content {
      padding: 20px;
      flex: 1;
    }

    .form-group {
      margin-bottom: 20px;
    }
    
    .form-row {
      display: flex;
      gap: 15px;
    }
    
    .half {
      flex: 1;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: var(--text-dark);
      font-size: 14px;
    }

    input, select, textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--light-border);
      border-radius: var(--border-radius);
      background-color: var(--white);
      font-size: 16px;
      color: var(--text-dark);
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--primary-green);
    }

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      background: var(--white);
      padding: 15px;
      border-radius: var(--border-radius);
      border: 1px solid var(--light-border);
    }

    .emoji-option {
      font-size: 28px;
      text-align: center;
      padding: 10px 0;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .emoji-option:hover {
      background-color: var(--primary-light);
    }

    .emoji-option.selected {
      border-color: var(--primary-green);
      background-color: var(--primary-light);
    }

    .submit-btn {
      width: 100%;
      padding: 16px;
      background-color: var(--primary-green);
      color: var(--white);
      border: none;
      border-radius: var(--border-radius);
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 10px;
    }
    
    .submit-btn:disabled {
      background-color: var(--text-gray);
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .success-message {
      margin-top: 15px;
      padding: 12px;
      background-color: var(--primary-light);
      color: var(--primary-dark);
      border-radius: var(--border-radius);
      text-align: center;
      font-weight: 500;
    }
  `]
})
export class AddProduct {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private router = inject(Router);

  availableEmojis = ['🥬', '🥒', '🍅', '🥔', '🥕', '🫛', '🥛', '🥚', '🌾', '🍎'];
  selectedEmoji = signal<string>('');
  isSubmitting = signal<boolean>(false);
  showSuccess = signal<boolean>(false);

  formData = {
    name: '',
    category: '',
    price: null,
    unit: '',
    description: '',
    isOrganic: true
  };

  selectEmoji(emoji: string) {
    this.selectedEmoji.set(emoji);
  }

  async onSubmit() {
    if (!this.selectedEmoji()) return;
    
    this.isSubmitting.set(true);
    
    try {
      const user = this.authService.user();
      
      const newProduct = {
        name: this.formData.name,
        category: this.formData.category,
        price: Number(this.formData.price),
        unit: this.formData.unit,
        description: this.formData.description,
        isOrganic: this.formData.isOrganic,
        imageUrl: this.selectedEmoji(),
        sellerId: user?.uid || 'unknown_seller',
        sellerName: 'My Farm',
        sellerLocation: 'Hyderabad',
        status: 'Active',
        rating: 0
      };

      await this.productService.addProduct(newProduct);
      
      this.showSuccess.set(true);
      setTimeout(() => {
        this.router.navigate(['/my-products']);
      }, 1500);
      
    } catch (error) {
      console.error('Error adding product', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
