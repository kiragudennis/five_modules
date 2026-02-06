// components/ProductCard.tsx
"use client";
import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Sun, Star, ShoppingCart, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { Product } from "@/types/store";
import { lightingCategories } from "@/lib/constants";

interface ProductCardProps {
  product: Product;
  isClicked: boolean;
  onAddToCart: (productId: string, e: React.MouseEvent) => void;
  isInStock: boolean;
}

const ProductCard = memo(
  function ProductCard({
    product,
    isClicked,
    onAddToCart,
    isInStock,
  }: ProductCardProps) {
    return (
      <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 pt-0 border hover:border-amber-200 dark:hover:border-amber-800">
        {/* Product Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          {product.isDealOfTheDay && (
            <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse text-xs">
              🔥 Deal
            </Badge>
          )}
          {product.featured && (
            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 z-10">
          {product.rating > 0 && (
            <div className="bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{product.rating}</span>
              {product.reviewsCount && product.reviewsCount > 0 && (
                <span className="text-gray-300 text-xs">
                  ({product.reviewsCount})
                </span>
              )}
            </div>
          )}
        </div>

        <Link href={`/products/${product.slug}`} className="block">
          <div className="aspect-square relative">
            {product.images?.[0] ? (
              <>
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
                <Sparkles className="h-8 w-8 text-amber-500 dark:text-amber-400" />
              </div>
            )}
          </div>

          <CardHeader className="sm:pb-2">
            <CardTitle className="sm:text-lg font-semibold line-clamp-1 pt-2 text-gray-900 dark:text-white">
              {product.title}
            </CardTitle>
            {product.category && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground capitalize">
                  {lightingCategories.find((c) => c.id === product.category)
                    ?.name || product.category}
                </p>
                {product.tags?.includes("solar-powered") && (
                  <Sun className="w-3 h-3 text-amber-500" />
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div>
                <p className="sm:text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(product.price, product.currency)}
                </p>
                {product.originalPrice && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice, product.currency)}
                  </p>
                )}
              </div>
              <Badge variant={isInStock ? "outline" : "destructive"}>
                {isInStock ? `${product.stock} in stock` : "Out of stock"}
              </Badge>
            </div>
          </CardContent>
        </Link>

        <CardFooter className="pt-0">
          <Button
            onClick={(e) => onAddToCart(product.id, e)}
            className={cn(
              "w-full transition-all duration-300 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600",
              "hover:scale-[1.02] active:scale-[0.98]",
              isClicked && "bg-green-500 hover:bg-green-600 m-0",
            )}
            disabled={!isInStock || isClicked}
          >
            <span className="flex items-center justify-center gap-2">
              {isClicked ? (
                <>
                  <Check className="h-4 w-4 animate-[bounce_0.3s]" />
                  <span className="animate-[fadeIn_0.3s]">Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </>
              )}
            </span>
          </Button>
        </CardFooter>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.isClicked === nextProps.isClicked &&
      prevProps.isInStock === nextProps.isInStock
    );
  },
);

export default ProductCard;
