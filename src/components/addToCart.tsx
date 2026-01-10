"use client";

import { useStore } from "@/lib/context/StoreContext";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils"; // optional helper if you use className merging
import { Product, ProductVariant } from "@/types/store"; // adjust imports based on your types

type AddToCartButtonProps = {
  product: Product;
  variant?: ProductVariant;
  quantity?: number;
  className?: string;
  children?: React.ReactNode;
};

export const AddToCartButton = ({
  product,
  quantity = 1,
  className = "",
  children,
}: AddToCartButtonProps) => {
  const { dispatch } = useStore();

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        product,
        quantity,
      },
    });
  };

  return (
    <button
      onClick={handleAddToCart}
      className={cn(
        "inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-all duration-150 active:scale-95",
        className
      )}
    >
      <ShoppingCart className="w-4 h-4" />
      {children || "Add to Cart"}
    </button>
  );
};
