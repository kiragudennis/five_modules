"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ShoppingCart,
  Package,
  Shield,
  Truck,
  CheckCircle,
  Star,
  Heart,
  Share2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/context/StoreContext";
import { Product } from "@/types/store";
import { FloatingCartButton } from "@/components/cartButton";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EmptyState } from "@/components/EmptyState";
import ProductShare from "./ProductShare";
import { formatCurrency, beltLevels } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductDetailPage({
  product,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const url = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    if (!api) return;

    const updateIndex = () => {
      setActiveIndex(api.selectedScrollSnap());
    };

    updateIndex();
    api.on("select", updateIndex);

    return () => {
      api.off("select", updateIndex);
    };
  }, [api]);

  // Add to cart with animation
  const { dispatch } = useStore();

  const handleAddToCart = (product: Product) => {
    setIsAddingToCart(true);

    dispatch({
      type: "ADD_TO_CART",
      payload: {
        product,
        quantity: quantity,
      },
    });

    // Show success animation
    setTimeout(() => setIsAddingToCart(false), 1500);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="container mx-auto py-8 px-2 sm:px-4">
      <FloatingCartButton />

      {/* Breadcrumb with Demo Badge */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/products"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Products
          </Link>
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <Eye className="w-3 h-3 mr-1" />
            Demo Product Showcase
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <span>/</span>
          <span className="font-medium">{product.category}</span>
          <span>/</span>
          <span className="font-medium truncate max-w-[200px]">
            {product.title}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Product Images & Gallery */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {product.images?.length ? (
                <div className="flex flex-col w-full">
                  {/* Main carousel */}
                  <div className="relative">
                    <Carousel className="w-full" setApi={setApi}>
                      <CarouselContent>
                        {product.images.map((img, idx) => (
                          <CarouselItem key={idx}>
                            <div className="aspect-square relative rounded-lg overflow-hidden border">
                              <Image
                                src={img}
                                alt={`${product.title} - Image ${idx + 1}`}
                                fill
                                className="object-cover transition-transform duration-300 hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 66vw"
                                priority={idx === 0}
                              />
                              {idx === 0 && product.featured && (
                                <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>

                    {/* Image counter */}
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      {activeIndex + 1} / {product.images.length}
                    </div>
                  </div>

                  {/* Thumbnail row */}
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => api?.scrollTo(idx)}
                        className={`relative w-16 h-16 border rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                          activeIndex === idx
                            ? "ring-2 ring-primary ring-offset-2"
                            : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Share & Actions */}
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2">
                      <ProductShare url={url} product={product} />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsWishlisted(!isWishlisted)}
                        className={`${
                          isWishlisted ? "text-red-600 border-red-200" : ""
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isWishlisted ? "fill-red-600" : ""
                          }`}
                        />
                        <span className="hidden sm:inline ml-2">Wishlist</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-square flex flex-col items-center justify-center border rounded-lg bg-muted">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Details & Actions */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              {/* Product Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">{product.category}</Badge>
                  {product.belt_level && product.belt_level !== "all" && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      {
                        beltLevels.find((b) => b.id === product.belt_level)
                          ?.name
                      }
                    </Badge>
                  )}
                  {product.featured && (
                    <Badge
                      variant="outline"
                      className="border-amber-300 text-amber-700"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {product.title}
                </h1>
                <p className="text-muted-foreground mb-4">{product.name}</p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">
                      {formatCurrency(product.price, product.currency)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatCurrency(
                          product.originalPrice,
                          product.currency
                        )}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < 4
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">
                      (24 reviews)
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Key Features */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">In Stock & Ready to Ship</p>
                    <p className="text-sm text-muted-foreground">
                      {product.stock > 0
                        ? `${product.stock} units available`
                        : "Out of stock - backorder available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Fast Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      Ships within 1-2 business days • Free shipping over 15,000
                      KES
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Secure Payment</p>
                    <p className="text-sm text-muted-foreground">
                      M-Pesa & PayPal integration • 30-day return policy
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Quantity & Add to Cart */}
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-2">Quantity</p>
                  <div className="flex items-center border rounded-lg w-fit">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-medium min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {product.stock > 0
                      ? `${product.stock} items left in stock`
                      : "This item is currently out of stock"}
                  </p>
                </div>

                <Button
                  disabled={product.stock === 0 || isAddingToCart}
                  onClick={() => handleAddToCart(product)}
                  className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                >
                  {isAddingToCart ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  ⚡ Add to cart to test the complete checkout experience
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Platform Capabilities */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">
                This Demo Shows Our Platform's Capabilities
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Professional product pages</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Image galleries & zoom</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Inventory management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Wishlist functionality</span>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full mt-4 border-blue-300"
              >
                <Link href="/contact">Get These Features for Your Store</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mb-12">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="reviews">Reviews (24)</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="space-y-4">
            <Card>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({ node, ...props }) => (
                        <h2 className="text-xl font-semibold mb-3" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-lg font-semibold mb-2" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 space-y-1" {...props} />
                      ),
                    }}
                  >
                    {product.description}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Product Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">SKU</span>
                        <span className="font-medium">
                          {product.sku || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">Category</span>
                        <span className="font-medium">{product.category}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">Weight</span>
                        <span className="font-medium">
                          {product.weight || "N/A"} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium mb-1">Shipping Information</h4>
                      <p className="text-sm text-muted-foreground">
                        • Ships within 1-2 business days
                        <br />
                        • Free shipping on orders over 15,000 KES
                        <br />
                        • Real-time shipping calculations at checkout
                        <br />• Multiple delivery options available
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      <div>
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold">
              You Might Also Like
            </h2>
            <p className="text-sm text-muted-foreground">
              Browse related products in our demo store
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/products">
              View All Products
              <ChevronLeft className="h-4 w-4 ml-1 rotate-180" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {relatedProducts.length > 0 ? (
            relatedProducts.map((relatedProduct) => (
              <Card
                key={relatedProduct.id}
                className="group hover:shadow-lg transition-all hover:-translate-y-1 pt-2"
              >
                <Link href={`/products/${relatedProduct.slug}`}>
                  <div className="aspect-square relative overflow-hidden">
                    {relatedProduct.images?.[0] ? (
                      <Image
                        src={relatedProduct.images[0]}
                        alt={relatedProduct.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-muted flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {relatedProduct.featured && (
                      <Badge className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                        Featured
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                      {relatedProduct.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">
                        {formatCurrency(
                          relatedProduct.price,
                          relatedProduct.currency
                        )}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {relatedProduct.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))
          ) : (
            <div className="col-span-4">
              <EmptyState
                title="No Related Products"
                description="We couldn't find any related products at the moment."
                icon="box"
                action={
                  <Button asChild>
                    <Link href="/products">Browse All Products</Link>
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
