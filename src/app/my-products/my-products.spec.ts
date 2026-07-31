import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyProducts } from './my-products';

describe('MyProducts', () => {
  let component: MyProducts;
  let fixture: ComponentFixture<MyProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyProducts],
    }).compileComponents();

    fixture = TestBed.createComponent(MyProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
