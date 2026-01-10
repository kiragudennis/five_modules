"use client";

import { useState, useEffect, useRef } from "react";
import { Cart } from "@/components/Cart";
import { ShoppingCart } from "lucide-react";
import { useStore } from "@/lib/context/StoreContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

export function FloatingCartButton() {
  const [open, setOpen] = useState(false);
  const [bounce, setBounce] = useState<null | "add" | "remove">(null);

  const { state } = useStore();
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  // 🔥 Bounce when totalItems increases
  const prevTotalRef = useRef(totalItems);

  useEffect(() => {
    if (prevTotalRef.current === totalItems) return;

    if (totalItems > prevTotalRef.current) {
      setBounce("add");
    } else if (totalItems < prevTotalRef.current) {
      setBounce("remove");
    }

    prevTotalRef.current = totalItems;

    const timer = setTimeout(() => setBounce(null), 600);
    return () => clearTimeout(timer);
  }, [totalItems]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-4 z-50 flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg hover:bg-yellow-600 cursor-pointer"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {bounce === "add" && (
            <span className="absolute -top-2 -right-2 text-xs bg-green-500 px-1 py-0.5 rounded-full animate-ping">
              +1
            </span>
          )}
          {bounce === "remove" && (
            <span className="absolute -top-2 -right-2 text-xs bg-red-500 px-1 py-0.5 rounded-full animate-ping">
              -1
            </span>
          )}
        </div>
        <span>{totalItems}</span>
      </button>

      {/* Cart modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        {/* REMOVED: <DialogTrigger>Open</DialogTrigger> */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Cart</DialogTitle>
            <DialogDescription>
              Review your items before checkout. Make sure everything looks good
              before you hit "Pay".
            </DialogDescription>
          </DialogHeader>
          <Cart />
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
