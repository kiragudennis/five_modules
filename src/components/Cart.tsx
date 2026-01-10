"use client";

import { useCart, useStore } from "@/lib/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function Cart() {
  const { state, dispatch } = useStore();
  const { clearCart } = useCart();

  const router = useRouter();

  const handleCheckout = () => {
    router.push("/checkout");
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      dispatch({
        type: "REMOVE_FROM_CART",
        payload: { productId },
      });
    } else {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId, quantity },
      });
    }
  };

  return (
    <div className="rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
      {state.cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div className="space-y-4 overflow-y-auto max-h-96">
            {state.cart.map((item) => (
              <div
                key={`${item.product.id}`}
                className="flex items-center justify-between border-b pb-4"
              >
                <div className="flex items-center space-x-4">
                  {item.product.images.length > 0 && (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold line-clamp-1">
                      {item.product.name}
                    </h3>
                    <p className="text-primary font-medium">
                      {formatCurrency(
                        item.product.price,
                        item.product.currency
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity - 1)
                    }
                    className="text-gray-500 hover:text-gray-700"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity + 1)
                    }
                    className="text-gray-500 hover:text-gray-700"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(state.total, "KES")}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Items</span>
              <span>{state.cart.length}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full mt-4 py-2 bg-green-600 text-white rounded hover:bg-bg-green-700"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              className="w-full mt-4 bg-red-600 text-white py-2 rounded hover:bg-red-700"
            >
              Clear Cart
            </button>
          </div>
        </>
      )}
    </div>
  );
}
