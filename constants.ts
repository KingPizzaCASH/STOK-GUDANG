
import { Category, Product } from './types';

export const STORAGE_KEY = 'stokpro_db_v1';

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Elektronik' },
  { id: '2', name: 'Pakaian' },
  { id: '3', name: 'Makanan' },
  { id: '4', name: 'Alat Kantor' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    sku: 'EL-001',
    name: 'Laptop Pro 14',
    categoryId: '1',
    price: 15000000,
    stock: 5,
    minStock: 2,
    description: 'Laptop performa tinggi untuk profesional',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p2',
    sku: 'MK-002',
    name: 'Kopi Arabika 250g',
    categoryId: '3',
    price: 75000,
    stock: 50,
    minStock: 10,
    description: 'Biji kopi pilihan kualitas ekspor',
    updatedAt: new Date().toISOString()
  }
];
