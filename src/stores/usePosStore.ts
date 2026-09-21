// src/stores/usePosStore.ts
import { create } from 'zustand';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface PosState {
  orderItems: OrderItem[];
  currentTableId: string | null; // ID de la venta abierta cargada
  tableName: string | null;      // Nombre de la mesa
  addItem: (item: OrderItem) => void;
  decreaseItem: (productId: string) => void;
  removeItem: (itemId: string) => void;
  clearOrder: () => void;
  getTotal: () => number;
  setOrderFromTable: (tableId: string, tableName: string, items: OrderItem[]) => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  orderItems: [],
  currentTableId: null,
  tableName: null,

  setOrderFromTable: (tableId, tableName, items) => set({
    currentTableId: tableId,
    tableName: tableName,
    orderItems: items
  }),

  addItem: (newItem) => set((state) => {
    const existingItem = state.orderItems.find(item => item.productId === newItem.productId);
    if (existingItem) {
      return {
        orderItems: state.orderItems.map(item => 
          item.productId === newItem.productId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      };
    }
    return { orderItems: [...state.orderItems, { ...newItem, quantity: 1 }] };
  }),

  decreaseItem: (productId) => set((state) => {
    const existingItem = state.orderItems.find(item => item.productId === productId);
    if (existingItem && existingItem.quantity > 1) {
      return {
        orderItems: state.orderItems.map(item =>
          item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
      };
    }
    return { orderItems: state.orderItems.filter(item => item.productId !== productId) };
  }),

  removeItem: (itemId) => set((state) => ({
    orderItems: state.orderItems.filter(item => item.id !== itemId)
  })),

  clearOrder: () => set({ orderItems: [], currentTableId: null, tableName: null }),

  getTotal: () => {
    return get().orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));