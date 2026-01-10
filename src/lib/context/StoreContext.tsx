"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import { CartItem } from "@/types/store";

interface StoreState {
  cart: CartItem[];
  total: number;
  pendingOrder: any;
}

type StoreAction =
  | { type: "ADD_TO_CART"; payload: CartItem }
  | {
      type: "REMOVE_FROM_CART";
      payload: { productId: string };
    }
  | {
      type: "UPDATE_QUANTITY";
      payload: { productId: string; quantity: number };
    }
  | { type: "CLEAR_CART" }
  | { type: "SET_PENDING_ORDER"; payload: any }
  | { type: "CLEAR_PENDING_ORDER" }
  | { type: "SET_TOTAL"; payload: number };
const initialState: StoreState = {
  cart: [],
  total: 0,
  pendingOrder: null,
};

const StoreContext = createContext<{
  state: StoreState;
  dispatch: React.Dispatch<StoreAction>;
} | null>(null);

function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItemIndex = state.cart.findIndex(
        (item) => item.product.id === action.payload.product.id
      );

      let newCart;
      if (existingItemIndex > -1) {
        newCart = state.cart.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newCart = [...state.cart, action.payload];
      }

      return {
        ...state,
        cart: newCart,
        total: calculateTotal(newCart),
      };
    }

    case "REMOVE_FROM_CART": {
      const newCart = state.cart.filter(
        (item) => !(item.product.id === action.payload.productId)
      );

      return {
        ...state,
        cart: newCart,
        total: calculateTotal(newCart),
      };
    }

    case "UPDATE_QUANTITY": {
      const newCart = state.cart.map((item) => {
        if (item.product.id === action.payload.productId) {
          return { ...item, quantity: action.payload.quantity };
        }
        return item;
      });

      return {
        ...state,
        cart: newCart,
        total: calculateTotal(newCart),
      };
    }

    case "CLEAR_CART":
      return {
        ...state,
        cart: [],
        total: 0,
      };

    case "SET_PENDING_ORDER":
      return {
        ...state,
        pendingOrder: action.payload,
      };

    case "CLEAR_PENDING_ORDER":
      return {
        ...state,
        pendingOrder: null,
      };

    case "SET_TOTAL":
      return {
        ...state,
        total: action.payload,
      };

    default:
      return state;
  }
}

function calculateTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => {
    const price = item.product.price;
    return total + price * item.quantity;
  }, 0);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

// Custom hook for cart
export function useCart() {
  const { state, dispatch } = useStore();

  const cartItems = state.cart;
  const clearCart = () => dispatch({ type: "CLEAR_CART" });

  return { cartItems, clearCart };
}

export function buildOrderData(state: StoreState, shipping: any) {
  return {
    total: state.total,
    currency: state.cart[0]?.product.currency || "USD",
    items: state.cart.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      title: item.product.title,
      image: item.product.images,
      price: item.product.price,
      quantity: item.quantity,
    })),
    shipping,
  };
}
