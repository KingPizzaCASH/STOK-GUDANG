
import { STORAGE_KEY, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../constants';
import { InventoryState } from '../types';

export const storageService = {
  loadData: (): InventoryState => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initialState: InventoryState = {
        products: INITIAL_PRODUCTS,
        transactions: [],
        categories: INITIAL_CATEGORIES
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
      return initialState;
    }
    return JSON.parse(raw);
  },

  saveData: (data: InventoryState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  clearData: () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
};
