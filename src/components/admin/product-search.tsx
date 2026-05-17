// components/admin/product-search.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Plus, Check, Package, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";
import { scrollableCategories } from "@/lib/constants";

interface Product {
  id: string;
  name: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  rating: number;
  reviews_count: number;
}

interface ProductSearchProps {
  onProductSelect: (product: Product & { quantity: number }) => void;
  selectedProductIds: string[];
  bundleType?: string;
}

export function ProductSearch({
  onProductSelect,
  selectedProductIds,
  bundleType,
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { supabase } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search products
  const searchProducts = useCallback(async () => {
    if (!searchTerm && !selectedCategory) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("search_products", {
        p_search_term: searchTerm || null,
        p_category: selectedCategory || null,
        p_limit: 20,
      });

      if (error) throw error;
      setProducts(data || []);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm || selectedCategory) {
        searchProducts();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, searchProducts]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProduct = (product: Product) => {
    onProductSelect({
      ...product,
      quantity,
    });
    setSearchTerm("");
    setShowResults(false);
    setQuantity(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isSelected = (productId: string) =>
    selectedProductIds.includes(productId);

  return (
    <div ref={searchRef} className="relative space-y-3">
      {/* Category Filter */}
      <div className="flex gap-2">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Categories">All Categories</SelectItem>
            {scrollableCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowResults(true)}
            placeholder="Search products by name, title, or SKU..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Quantity Selector for next product */}
      {bundleType !== "tiered" && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">
            Default Quantity:
          </label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-20"
          />
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && (searchTerm || selectedCategory) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b flex justify-between items-center">
            <span className="text-sm font-medium">Products</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResults(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="max-h-80">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">
                  Searching...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No products found
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={cn(
                      "p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                      isSelected(product.id) &&
                        "bg-muted opacity-50 cursor-not-allowed",
                    )}
                    onClick={() =>
                      !isSelected(product.id) && handleSelectProduct(product)
                    }
                  >
                    <div className="flex gap-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="font-semibold">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Stock: {product.stock}
                          </span>
                          {product.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              <span className="text-xs">{product.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {!isSelected(product.id) && (
                        <Button size="sm" variant="ghost">
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                      {isSelected(product.id) && (
                        <Badge className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Added
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
