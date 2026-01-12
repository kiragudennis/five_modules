// components/CopyCouponBar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type CopyCouponBarProps = {
  code: string;
  minAmount: string;
};

export default function CopyCouponBar({ code, minAmount }: CopyCouponBarProps) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Coupon code copied to clipboard!");
    } catch {
      console.error("Clipboard said nope");
    }
  };

  return (
    <div className="flex justify-between items-center text-xs">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        onClick={copy}
      >
        Copy Code
      </Button>

      <div className="text-gray-500">Min: {minAmount}</div>
    </div>
  );
}
