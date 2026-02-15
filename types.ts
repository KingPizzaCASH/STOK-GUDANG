
export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT'
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  minStock: number;
  description: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  reason: string;
  date: string;
}

export interface InventoryState {
  products: Product[];
  transactions: Transaction[];
  categories: Category[];
}

export interface AIInsight {
  status: 'critical' | 'warning' | 'good';
  message: string;
  suggestion: string;
}
