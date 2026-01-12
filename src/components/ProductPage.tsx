// src/components/ProductPage.tsx
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
  Zap,
  Sun,
  BatteryCharging,
  Clock,
  Bolt,
  MapPin,
  Phone,
  Users,
  Award,
  ShieldCheck,
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
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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

    toast.success(`Added ${quantity} × ${product.title} to cart!`);

    // Show success animation
    setTimeout(() => setIsAddingToCart(false), 1500);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  // Calculate discount percentage
  const discountPercentage = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  // Lighting category icons
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "solar-lights":
        return <Sun className="h-4 w-4" />;
      case "led-bulbs":
        return <Zap className="h-4 w-4" />;
      case "batteries":
        return <BatteryCharging className="h-4 w-4" />;
      case "security-lights":
        return <Shield className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-2 sm:px-4">
      <FloatingCartButton />

      {/* Breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/products"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Products
          </Link>

          {/* Store Badge */}
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-700"
          >
            <MapPin className="w-3 h-3 mr-1" />
            Duruma Road, Nairobi
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">
            Lighting Products
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
          <Card className="border-amber-100 dark:border-amber-800/30">
            <CardContent className="p-6">
              {product.images?.length ? (
                <div className="flex flex-col w-full">
                  {/* Deal of the Day Banner */}
                  {product.isDealOfTheDay && (
                    <div className="mb-4">
                      <div className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white p-3 rounded-lg flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-2">
                          <Bolt className="h-5 w-5" />
                          <span className="font-bold">⚡ DEAL OF THE DAY!</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            Ends tonight at midnight
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Main carousel */}
                  <div className="relative">
                    <Carousel className="w-full" setApi={setApi}>
                      <CarouselContent>
                        {product.images.map((img, idx) => (
                          <CarouselItem key={idx}>
                            <div className="aspect-square relative rounded-lg overflow-hidden border border-amber-200">
                              <Image
                                src={img}
                                alt={`${product.title} - Image ${idx + 1}`}
                                fill
                                className="object-cover transition-transform duration-300 hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 66vw"
                                priority={idx === 0}
                              />

                              {/* Discount Badge */}
                              {discountPercentage > 0 && idx === 0 && (
                                <Badge className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 border-0 text-white">
                                  SAVE {discountPercentage}%
                                </Badge>
                              )}

                              {/* Featured Badge */}
                              {product.featured && idx === 0 && (
                                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-cyan-500 border-0">
                                  <Star className="w-3 h-3 mr-1" />
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
                  <div className="mt-4 flex gap-2 overflow-x-auto p-2">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => api?.scrollTo(idx)}
                        className={`relative w-16 h-16 border rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                          activeIndex === idx
                            ? "ring-2 ring-amber-500 ring-offset-2"
                            : "opacity-70 hover:opacity-100 border-amber-100"
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

                  {/* Product Rating */}
                  {product.rating && product.rating > 0 && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold">
                        {product.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({product.reviewsCount || 0} reviews)
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge variant="outline" className="text-xs">
                        ⭐{" "}
                        {product.rating >= 4.5
                          ? "Excellent"
                          : product.rating >= 4
                          ? "Great"
                          : "Good"}
                      </Badge>
                    </div>
                  )}

                  {/* Share & Actions */}
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-amber-100">
                    <div className="flex items-center gap-2">
                      <ProductShare url={url} product={product} />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsWishlisted(!isWishlisted)}
                        className={`border-amber-300 ${
                          isWishlisted
                            ? "text-red-600 border-red-200 bg-red-50"
                            : "text-amber-600 hover:bg-amber-50"
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isWishlisted ? "fill-red-600" : ""
                          }`}
                        />
                        <span className="hidden sm:inline ml-2">
                          {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-square flex flex-col items-center justify-center border-amber-200 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50">
                  <Package className="h-12 w-12 text-amber-400 mb-4" />
                  <p className="text-amber-600">Image coming soon</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Details & Actions */}
        <div className="space-y-6">
          <Card className="sticky top-24 border-amber-100 dark:border-amber-800/30">
            <CardContent className="p-6">
              {/* Product Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant="outline"
                    className="border-amber-300 text-amber-700"
                  >
                    <div className="flex items-center gap-1">
                      {getCategoryIcon(product.category)}
                      <span className="capitalize">
                        {product.category?.replace("-", " ")}
                      </span>
                    </div>
                  </Badge>

                  {product.isDealOfTheDay && (
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 border-0 text-white animate-pulse">
                      <Bolt className="h-3 w-3 mr-1" />
                      Deal of the Day
                    </Badge>
                  )}

                  {product.featured && (
                    <Badge
                      variant="outline"
                      className="border-blue-300 text-blue-700"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                  {product.title}
                </h1>
                <p className="text-muted-foreground mb-4">{product.name}</p>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-bold text-amber-600">
                    {formatCurrency(product.price, product.currency)}
                  </span>

                  {product.originalPrice && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        {formatCurrency(
                          product.originalPrice,
                          product.currency
                        )}
                      </span>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        Save {discountPercentage}%
                      </Badge>
                    </>
                  )}
                </div>

                {/* Stock Status */}
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mb-4",
                    product.stock > 10
                      ? "bg-green-100 text-green-800"
                      : product.stock > 0
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      product.stock > 10
                        ? "bg-green-500"
                        : product.stock > 0
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    )}
                  />
                  {product.stock > 10
                    ? `In Stock (${product.stock} units)`
                    : product.stock > 0
                    ? `Low Stock (Only ${product.stock} left)`
                    : "Out of Stock"}
                </div>
              </div>

              <Separator className="my-6 border-amber-100" />

              {/* Key Features - Lighting Specific */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">2-Year Warranty</p>
                    <p className="text-sm text-muted-foreground">
                      Quality guaranteed for 24 months
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Same-Day Nairobi Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      Order by 2PM, get it today. Free over KES 3,000
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Professional Installation</p>
                    <p className="text-sm text-muted-foreground">
                      Expert installation available
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">24/7 Expert Support</p>
                    <p className="text-sm text-muted-foreground">
                      Call 0700 000 000 for lighting advice
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-6 border-amber-100" />

              {/* Quantity & Add to Cart */}
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-2">Quantity</p>
                  <div className="flex items-center border border-amber-300 rounded-lg w-fit">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 hover:bg-amber-50"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-medium min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 hover:bg-amber-50"
                    >
                      +
                    </button>
                  </div>
                  {product.stock > 0 && product.stock <= 10 && (
                    <p className="text-sm text-amber-600 mt-1">
                      ⚡ Hurry! Only {product.stock} left in stock
                    </p>
                  )}
                </div>

                <Button
                  disabled={product.stock === 0 || isAddingToCart}
                  onClick={() => handleAddToCart(product)}
                  className="w-full h-12 text-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
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

                {/* Buy Now Button */}
                <Button
                  variant="outline"
                  disabled={product.stock === 0}
                  className="w-full h-12 text-lg border-amber-300 text-amber-600 hover:bg-amber-50"
                  asChild
                >
                  <Link href="/checkout">Buy Now & Pay with M-Pesa</Link>
                </Button>

                {/* Coupon Alert */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-700 mb-1">
                    🎁 Use coupon code:{" "}
                    <span className="font-bold">WELCOME15</span>
                  </p>
                  <p className="text-xs text-amber-600">
                    Get 15% off your first order at checkout!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Benefits Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                Why Shop With Blessed Two?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Nairobi's Largest Lighting Selection
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Same-Day Delivery in Nairobi</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    2-Year Warranty on All Products
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Free Expert Installation Available
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">24/7 Customer Support</span>
                </div>
              </div>

              <Separator className="my-4 border-amber-200" />

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Visit our store in Duruma Road, Nairobi
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-amber-300 text-amber-600 hover:bg-amber-50"
                >
                  <a href="tel:0700000000">
                    <Phone className="h-4 w-4 mr-2" />
                    Call: 0700 000 000
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mb-12">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6 bg-amber-50 dark:bg-amber-950/20">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="warranty">Warranty & Support</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({product.reviewsCount || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="space-y-4">
            <Card className="border-amber-100">
              <CardContent className="p-6">
                <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-xl font-semibold mb-3 text-amber-700"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-lg font-semibold mb-2 text-amber-600"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 space-y-2" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          className="text-gray-700 dark:text-gray-300"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {product.description || "No description available."}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications">
            <Card className="border-amber-100">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4 text-lg">
                      Product Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">SKU</span>
                        <span className="font-medium">
                          {product.sku || "BTE-" + product.id.substring(0, 8)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Category</span>
                        <span className="font-medium capitalize">
                          {product.category?.replace("-", " ") || "Lighting"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Wattage</span>
                        <span className="font-medium">
                          {product.metadata?.wattage || "N/A"} Watts
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Voltage</span>
                        <span className="font-medium">
                          {product.metadata?.voltage || "220-240V"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">
                          Color Temperature
                        </span>
                        <span className="font-medium">
                          {product.metadata?.colorTemp || "Warm White (3000K)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4 text-lg">
                      Features & Tags
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Key Features:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "Energy Saving",
                            "Long Lifespan",
                            "Eco Friendly",
                            "Dimmable",
                            "Weatherproof",
                            ...(product.tags || []),
                          ]
                            .slice(0, 6)
                            .map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-amber-100 text-amber-700 border-amber-200"
                              >
                                {tag}
                              </Badge>
                            ))}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          Compatibility:
                        </p>
                        <p className="text-sm">
                          Works with standard E27/E26 sockets. Suitable for
                          indoor and outdoor use.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="warranty">
            <Card className="border-amber-100">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <ShieldCheck className="h-8 w-8 text-green-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-lg mb-2">
                        2-Year Warranty
                      </h4>
                      <p className="text-gray-700">
                        All Blessed Two Electronics products come with a
                        comprehensive 24-month warranty covering manufacturing
                        defects and premature failures.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h5 className="font-medium">Warranty Coverage</h5>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Manufacturing defects</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Premature component failure</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Electrical faults</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h5 className="font-medium">Support Services</h5>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Users className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span>Free installation consultation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Phone className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span>24/7 technical support</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Truck className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span>On-site repair service</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4">
                    <h5 className="font-medium mb-2">Need Help?</h5>
                    <p className="text-sm text-gray-700 mb-3">
                      Contact our support team for warranty claims or technical
                      assistance.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" asChild>
                        <a href="tel:0700000000">
                          <Phone className="h-3 w-3 mr-1" />
                          Call Support
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href="mailto:support@blessedtwo.co.ke">
                          <Mail className="h-3 w-3 mr-1" />
                          Email Support
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="border-amber-100">
              <CardContent className="p-6">
                {product.reviewsCount && product.reviewsCount > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-amber-600">
                          {product.rating?.toFixed(1) || "4.8"}
                        </div>
                        <div className="flex items-center justify-center my-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(product.rating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {product.reviewsCount} verified reviews
                        </p>
                      </div>

                      <div className="flex-1">
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <div
                            key={stars}
                            className="flex items-center gap-2 mb-1"
                          >
                            <span className="text-sm w-4">{stars}</span>
                            <Star className="h-3 w-3 text-amber-400" />
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400"
                                style={{
                                  width: `${
                                    stars === 5
                                      ? 75
                                      : stars === 4
                                      ? 15
                                      : stars === 3
                                      ? 5
                                      : stars === 2
                                      ? 3
                                      : 2
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sample Reviews */}
                    <div className="space-y-4">
                      {[
                        {
                          name: "John M.",
                          rating: 5,
                          comment:
                            "Excellent product! Bright and energy efficient. Perfect for my home.",
                          date: "2 days ago",
                        },
                        {
                          name: "Sarah K.",
                          rating: 4,
                          comment:
                            "Good quality and fast delivery. Could be brighter though.",
                          date: "1 week ago",
                        },
                        {
                          name: "David W.",
                          rating: 5,
                          comment:
                            "Professional installation team. The light transformed my backyard!",
                          date: "2 weeks ago",
                        },
                      ].map((review, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{review.name}</p>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < review.rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {review.date}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="font-medium mb-2">No Reviews Yet</h4>
                    <p className="text-muted-foreground mb-4">
                      Be the first to review this product
                    </p>
                    <Button variant="outline">Write a Review</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      <div>
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              Related Lighting Products
            </h2>
            <p className="text-sm text-muted-foreground">
              Complete your lighting setup with these recommended products
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-amber-300 text-amber-600 hover:bg-amber-50"
          >
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
                className="group hover:shadow-lg transition-all hover:-translate-y-1 border-amber-100 hover:border-amber-300"
              >
                <Link href={`/products/${relatedProduct.slug}`}>
                  <div className="aspect-square relative overflow-hidden">
                    {relatedProduct.images?.[0] ? (
                      <>
                        <Image
                          src={relatedProduct.images[0]}
                          alt={relatedProduct.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        {relatedProduct.isDealOfTheDay && (
                          <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 border-0 text-white text-xs">
                            🔥 Deal
                          </Badge>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center">
                        <Package className="h-8 w-8 text-amber-400" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-1 mb-2 group-hover:text-amber-600 transition-colors">
                      {relatedProduct.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-600">
                        {formatCurrency(
                          relatedProduct.price,
                          relatedProduct.currency
                        )}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-200"
                      >
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

      {/* Store CTA */}
      <Card className="mt-12 bg-gradient-to-r from-amber-600 to-yellow-600 text-white overflow-hidden">
        <CardContent className="p-8 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Visit Our Nairobi Store
                </h3>
                <p className="opacity-90">
                  See our complete range of lighting solutions in person. Get
                  expert advice and professional installation services.
                </p>
                <div className="mt-4 space-y-2">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Duruma Road, Nairobi
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Mon-Sat: 8AM-8PM | Sun: 10AM-4PM
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    0727 833 691
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  asChild
                  className="bg-white text-amber-700 hover:bg-white/90"
                >
                  <a
                    href="https://maps.google.com/?q=Duruma+Road+Nairobi"
                    target="_blank"
                  >
                    Get Directions
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white text-white hover:bg-white/20"
                >
                  <a href="tel:0727833691">Call Now</a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add Mail icon
function Mail({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
