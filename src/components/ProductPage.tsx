// src/components/ProductPage.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  Star,
  Heart,
  Zap,
  Sun,
  Clock,
  Bolt,
  MapPin,
  Phone,
  Award,
  ShieldCheck,
  Play,
  Ruler,
  Thermometer,
  Droplets,
  Battery,
  Eye,
  Volume2,
  Mail,
  Sparkles,
  Power,
  Globe,
  Users,
  MessageCircle,
  Gift,
  Images,
  Variable,
  Space,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, useStore } from "@/lib/context/StoreContext";
import { Product, Variaty } from "@/types/store";
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
import { lightingCategories } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { ProductVarieties } from "./ProductVarieties";

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
  const [showVideo, setShowVideo] = useState(false);
  const { totalItems } = useCart();
  const { profile } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState(
    typeof window !== "undefined" ? window.location.origin : "",
  );
  const [selectedVariety, setSelectedVariety] = useState<Variaty | null>(
    product.varieties?.find((v) => v.is_default) ||
      product.varieties?.[0] ||
      null,
  );
  const [currentImages, setCurrentImages] = useState(
    selectedVariety?.images?.length
      ? selectedVariety.images
      : product.images || [],
  );
  const [showingVarietyImages, setShowingVarietyImages] = useState(
    !!selectedVariety?.images?.length,
  );

  const handleVarietyChange = (variety: Variaty) => {
    setSelectedVariety(variety);
  };

  const handleVarietyImagesChange = (images: string[]) => {
    setCurrentImages(images);
    setShowingVarietyImages(true);

    // Optional: Show a toast notification
    toast.info(`Now showing ${selectedVariety?.name}`, {
      duration: 2000,
    });
  };

  const resetToMainImages = () => {
    setCurrentImages(product.images || []);
    setShowingVarietyImages(false);
    setSelectedVariety(null);
  };

  // Update price display based on selected variety
  const displayPrice = selectedVariety?.price || product.price;
  const displayOriginalPrice =
    selectedVariety?.original_price || product.originalPrice;
  const displayWholesalePrice =
    selectedVariety?.wholesale_price || product.wholesale_price;
  const displayWholesaleMinQuantity =
    selectedVariety?.wholesale_min_quantity || product.wholesale_min_quantity;
  const displayStock = selectedVariety?.stock || product.stock;
  const displaySku = selectedVariety?.sku || product.sku;

  // Get attributes for selected variety;
  const varietyType = selectedVariety?.variety_type;
  const varietyValue = selectedVariety?.variant_value;

  const generateReferralLink = () => {
    const shareUrl = new URL(`${url}/products/${product.slug}`);

    // Add customer ID and product ID if logged in
    if (profile?.id) {
      shareUrl.searchParams.set("customerId", profile.id);
      shareUrl.searchParams.set("productId", product.id);

      // Add a timestamp to prevent caching issues
      shareUrl.searchParams.set("ref", Date.now().toString());
    }

    return shareUrl.toString();
  };

  // Referral capture
  useEffect(() => {
    const generatelink = generateReferralLink();
    setUrl(generatelink);

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const referrerId = urlParams.get("customerId");
      const productId = urlParams.get("productId");

      if (referrerId && productId && referrerId !== profile?.id) {
        // Create unique referral key for this combination
        const referralKey = `referral_${productId}_${referrerId}`;

        // Check if referral already exists and is still valid
        const existingReferral = localStorage.getItem(referralKey);

        if (existingReferral) {
          const referralData = JSON.parse(existingReferral);
          const expiresAt = new Date(referralData.expiresAt);

          // If referral is still valid, just update timestamp
          if (expiresAt > new Date()) {
            // Update timestamp but keep existing data
            localStorage.setItem(
              referralKey,
              JSON.stringify({
                ...referralData,
                timestamp: new Date().toISOString(),
              }),
            );
            return;
          }
        }

        // Store new referral
        localStorage.setItem(
          referralKey,
          JSON.stringify({
            referrerId,
            productId,
            timestamp: new Date().toISOString(),
            expiresAt: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        );

        // Show success notification with points info
        toast.success(
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Referral Link Applied! 🎉</p>
              <p className="text-sm text-muted-foreground">
                Your friend will earn {product.referral_points || 100} points
                when you purchase
              </p>
            </div>
          </div>,
          { duration: 8000 },
        );
      }
    }
  }, [product.id, profile?.id]);

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
        product: {
          ...product,
          tags: product.tags ?? [],
          id: selectedVariety?.id || product.id, // Use variety ID for cart item
          sku: displaySku,
          price: displayPrice,
          originalPrice: displayOriginalPrice,
          wholesale_price: displayWholesalePrice,
          wholesale_min_quantity: displayWholesaleMinQuantity,
          stock: displayStock,
          images: currentImages,
        },
        quantity: quantity,
        variant: selectedVariety || undefined,
      },
    });

    toast.success(`Added ${quantity} × ${product.title} to cart!`);

    // Show success animation
    setTimeout(() => setIsAddingToCart(false), 1500);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= displayStock) {
      setQuantity(newQuantity);
    }
  };

  // Calculate discount percentage
  const discountPercentage = displayOriginalPrice
    ? Math.round(
        ((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100,
      )
    : 0;

  // Get category details
  const categoryDetails = lightingCategories.find(
    (cat: any) => cat.id === product.category,
  );

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
          <Link href="/products" className="hover:text-foreground truncate">
            Lighting Products
          </Link>
          <span>/</span>
          <span className="font-medium truncate">
            {categoryDetails?.name || product.category}
          </span>
          <span>/</span>
          <span className="font-medium truncate max-w-[200px]">
            {product.title}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-12">
        {/* Product Images & Gallery */}
        <div className="lg:col-span-2">
          <Card className="border-amber-100 dark:border-amber-800/30">
            <CardContent>
              {currentImages.length ? (
                <div className="flex flex-col w-full">
                  {/* Variety Images Banner */}
                  {showingVarietyImages && selectedVariety && (
                    <div className="mb-4">
                      <div className="flex flex-wrap items-center justify-between bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Images className="h-5 w-5" />
                          <span className="font-medium text-sm">
                            Showing {selectedVariety.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-white/20 text-white border-white/30"
                          >
                            {selectedVariety.images?.length || 0} image(s)
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetToMainImages}
                            className="text-white hover:bg-white/20"
                          >
                            View Main Product
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Main carousel */}
                  <div className="relative">
                    <Carousel className="w-full" setApi={setApi}>
                      <CarouselContent>
                        {/* Video thumbnail if available and not showing variety images */}
                        {!showingVarietyImages && product.videoUrl && (
                          <CarouselItem>
                            <div className="aspect-square relative rounded-lg overflow-hidden border border-amber-200 group cursor-pointer">
                              {showVideo ? (
                                <video
                                  src={product.videoUrl}
                                  controls
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <>
                                  <Image
                                    src={product.images[0]}
                                    alt={product.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 66vw"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-all group-hover:bg-black/50">
                                    <Button
                                      onClick={() => setShowVideo(true)}
                                      className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
                                      size="lg"
                                    >
                                      <Play className="h-8 w-8 fill-white" />
                                      <span className="ml-2 text-white font-semibold">
                                        Watch Demo
                                      </span>
                                    </Button>
                                  </div>
                                  <div className="absolute bottom-4 left-4">
                                    <Badge className="bg-black/70 text-white border-0">
                                      <Play className="h-3 w-3 mr-1" />
                                      Video Demo
                                    </Badge>
                                  </div>
                                </>
                              )}
                            </div>
                          </CarouselItem>
                        )}

                        {/* Product/Variety Images */}
                        {currentImages.map((img, idx) => (
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

                              {/* Variety Badge for variety images */}
                              {showingVarietyImages &&
                                selectedVariety &&
                                idx === 0 && (
                                  <Badge className="absolute top-3 left-3 bg-blue-500 border-0">
                                    <Images className="h-3 w-3 mr-1" />
                                    {selectedVariety.name}
                                  </Badge>
                                )}

                              {/* Other badges remain the same */}
                              {!showingVarietyImages &&
                                discountPercentage > 0 &&
                                idx === 0 && (
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

                              {/* Best Seller Badge */}
                              {product.bestSeller && idx === 0 && (
                                <Badge className="absolute top-12 right-3 bg-gradient-to-r from-green-500 to-emerald-500 border-0">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Best Seller
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
                      {activeIndex + 1} / {currentImages.length}
                    </div>
                  </div>

                  {/* Thumbnail row */}
                  <div className="mt-4 flex gap-2 overflow-x-auto p-2">
                    {/* Video thumbnail - only show when not showing variety images */}
                    {!showingVarietyImages && product.videoUrl && (
                      <button
                        onClick={() => {
                          api?.scrollTo(0);
                          setShowVideo(false);
                        }}
                        className={`relative w-16 h-16 border rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                          activeIndex === 0
                            ? "ring-2 ring-amber-500 ring-offset-2"
                            : "opacity-70 hover:opacity-100 border-amber-100"
                        }`}
                      >
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="h-4 w-4 text-white fill-white" />
                        </div>
                        <Image
                          src={currentImages[0]}
                          alt="Video thumbnail"
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </button>
                    )}

                    {/* Image thumbnails */}
                    {currentImages.map((img, idx) => {
                      const imageIndex =
                        idx +
                        (!showingVarietyImages && product.videoUrl ? 1 : 0);
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            api?.scrollTo(imageIndex);
                            setShowVideo(false);
                          }}
                          className={`relative w-16 h-16 border rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                            activeIndex === imageIndex
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
                          {/* Show variety indicator on thumbnails when viewing variety images */}
                          {showingVarietyImages && (
                            <div className="absolute top-0 left-0 bg-blue-500 text-white text-[8px] px-1 rounded-br">
                              V
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Technical Highlights */}
                  <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {varietyType && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                        <Variable className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                        <div className="text-sm font-semibold">
                          {varietyType}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Variant
                        </div>
                      </div>
                    )}

                    {varietyValue && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                        <Space className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                        <div className="text-sm font-semibold">
                          {varietyValue}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Variant Value
                        </div>
                      </div>
                    )}

                    {product.lumens && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                        <Eye className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                        <div className="text-sm font-semibold">
                          {product.lumens.toLocaleString()} lm
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Brightness
                        </div>
                      </div>
                    )}

                    {product.warrantyMonths && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                        <ShieldCheck className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                        <div className="text-sm font-semibold">
                          {product.warrantyMonths} mo
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Warranty
                        </div>
                      </div>
                    )}

                    {product.energySaving && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                        <Sparkles className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                        <div className="text-sm font-semibold">
                          Energy Saving
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Eco Friendly
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Rating */}
                  {Number(product.rating) > 0 && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      {`${console.log("Product rating:", product.rating)}`}
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(Number(product.rating) || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold">
                        {product.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
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

                  {/* Wholesale Pricing Display */}
                  {product.has_wholesale && displayWholesalePrice && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-2 sm:p-4 items-baseline gap-3 my-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        <p className="font-semibold text-purple-700 dark:text-purple-300">
                          Wholesale Price Available
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Wholesale Price
                          </p>
                          <p className="text-2xl font-bold text-purple-600">
                            {formatCurrency(
                              displayWholesalePrice,
                              product.currency,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Min. Quantity
                          </p>
                          <p className="text-2xl font-bold text-purple-600">
                            {displayWholesaleMinQuantity}+ units
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                        Save{" "}
                        {Math.round(
                          ((displayPrice - displayWholesalePrice) /
                            displayPrice) *
                            100,
                        )}
                        % per unit when you order {displayWholesaleMinQuantity}+
                        units
                      </p>
                    </div>
                  )}

                  {product.has_varieties &&
                    product.varieties &&
                    product.varieties.length > 0 && (
                      <div className="mb-6">
                        <ProductVarieties
                          varieties={product.varieties}
                          onVarietyChange={handleVarietyChange}
                          onVarietyImagesChange={handleVarietyImagesChange}
                          selectedVarietyId={selectedVariety?.id}
                        />
                      </div>
                    )}

                  {/* Share & Actions */}
                  <div className="flex flex-col items-center justify-between mt-6 pt-6 border-t border-amber-100 gap-4">
                    {/* Share Component */}
                    <div className="relative group">
                      <ProductShare url={url} product={product} />
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Referral Points Display */}
                      <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
                        <Gift className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs font-medium text-green-700 dark:text-green-300">
                            Earn {product.referral_points || 100} Points
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Share & earn when friends buy
                          </p>
                        </div>
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
          <Card className="border-amber-100 dark:border-amber-800/30">
            <CardContent>
              {/* Product Header */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {categoryDetails && (
                    <Badge
                      variant="outline"
                      className="border-amber-300 text-amber-700"
                    >
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-3 h-3 rounded-full bg-gradient-to-r ${categoryDetails.color}`}
                        />
                        <span className="capitalize">
                          {categoryDetails.name}
                        </span>
                      </div>
                    </Badge>
                  )}

                  {product.dealOfTheDay && (
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

                  {product.bestSeller && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 border-0 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Best Seller
                    </Badge>
                  )}

                  {product.energySaving && (
                    <Badge className="bg-gradient-to-r from-green-600 to-teal-500 border-0 text-white">
                      <Zap className="h-3 w-3 mr-1" />
                      Energy Saving
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
                    {formatCurrency(displayPrice, product.currency)}
                  </span>

                  {displayOriginalPrice && (
                    <div className="flex items-center justify-between flex-wrap w-full">
                      <span className="text-lg text-gray-500 line-through">
                        {formatCurrency(displayOriginalPrice, product.currency)}
                      </span>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        Save {discountPercentage}%
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Technical Quick View */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {product.voltage && (
                    <div className="flex items-center gap-2 text-sm">
                      <Power className="h-4 w-4 text-amber-500" />
                      <span>{product.voltage}</span>
                    </div>
                  )}
                  {product.ipRating && (
                    <div className="flex items-center gap-2 text-sm">
                      <Droplets className="h-4 w-4 text-amber-500" />
                      <span>{product.ipRating}</span>
                    </div>
                  )}
                </div>

                {/* Stock Status */}
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mb-4",
                    displayStock > 10
                      ? "bg-green-100 text-green-800"
                      : displayStock > 0
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800",
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      displayStock > 10
                        ? "bg-green-500"
                        : displayStock > 0
                          ? "bg-yellow-500"
                          : "bg-red-500",
                    )}
                  />
                  {displayStock > 10
                    ? `In Stock (${displayStock} units)`
                    : displayStock > 0
                      ? `Low Stock (Only ${displayStock} left)`
                      : "Out of Stock"}
                </div>
              </div>

              <Separator className="my-6 border-amber-100" />

              {/* Key Features - Lighting Specific */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {product.warrantyMonths || 24}-Month Warranty
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Quality guaranteed for {product.warrantyMonths || 24}{" "}
                      months
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
                    <Award className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {product.installationType || "DIY"} Installation
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.installationType === "Professional Required"
                        ? "Expert installation available"
                        : product.installationType === "Plug & Play"
                          ? "Easy plug and play setup"
                          : "Easy do-it-yourself installation"}
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
                      Call 0727 833 691 for lighting advice
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
                      disabled={quantity >= displayStock}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 hover:bg-amber-50"
                    >
                      +
                    </button>
                  </div>
                  {/* Wholesale Quantity Alert */}
                  {product.has_wholesale && displayWholesaleMinQuantity && (
                    <div
                      className={`mt-2 p-2 rounded-md ${
                        quantity >= displayWholesaleMinQuantity
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      <p className="text-sm">
                        {quantity >= displayWholesaleMinQuantity ? (
                          <>
                            ✅ Wholesale price applied! You're saving{" "}
                            {formatCurrency(
                              (displayPrice - displayWholesalePrice) * quantity,
                              product.currency,
                            )}
                          </>
                        ) : (
                          <>
                            📦 Add {displayWholesaleMinQuantity - quantity} more
                            to get wholesale price
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Low Stock Alert */}
                  {displayStock > 0 && displayStock <= 10 && (
                    <p className="text-sm text-amber-600 mt-1">
                      ⚡ Hurry! Only {displayStock} left in stock
                    </p>
                  )}
                </div>

                {/* Price Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span>Unit Price:</span>
                    <span className="font-medium">
                      {product.has_wholesale &&
                      quantity >= displayWholesaleMinQuantity
                        ? formatCurrency(
                            displayWholesalePrice,
                            product.currency,
                          )
                        : formatCurrency(displayPrice, product.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="text-lg font-bold text-amber-600">
                      {product.has_wholesale &&
                      quantity >= displayWholesaleMinQuantity
                        ? formatCurrency(
                            displayWholesalePrice * quantity,
                            product.currency,
                          )
                        : formatCurrency(
                            displayPrice * quantity,
                            product.currency,
                          )}
                    </span>
                  </div>
                  {product.has_wholesale &&
                    quantity >= displayWholesaleMinQuantity && (
                      <div className="flex justify-between text-green-600 mt-1">
                        <span>You Save:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            (displayPrice - displayWholesalePrice) * quantity,
                            product.currency,
                          )}
                        </span>
                      </div>
                    )}
                </div>

                <Button
                  disabled={displayStock === 0 || isAddingToCart}
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
                      {displayStock === 0 ? "Out of Stock" : "Add to Cart"}
                    </>
                  )}
                </Button>

                {/* Buy Now Button */}
                <Button
                  variant="outline"
                  onClick={() => {
                    if (displayStock === 0) {
                      toast.error("There isn't enough stock left");
                    } else if (totalItems === 0) {
                      toast.error("Please add items to cart");
                    } else {
                      router.push("/checkout");
                    }
                  }}
                  className="w-full h-12 text-lg border-amber-300 text-amber-600 hover:bg-amber-50"
                >
                  Buy Now & Pay with M-Pesa
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

          {/* Quick Specs Card */}
          <Card className="border-amber-100">
            <CardContent>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                Quick Specifications
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Voltage",
                    value: product.voltage || "220-240V",
                    icon: Power,
                  },
                  {
                    label: "Lumens",
                    value: product.lumens
                      ? `${product.lumens.toLocaleString()} lm`
                      : "Not specified",
                    icon: Eye,
                  },
                  {
                    label: "IP Rating",
                    value: product.ipRating || "IP20 (Indoor)",
                    icon: Droplets,
                  },
                  {
                    label: "Dimensions",
                    value: product.dimensions || "Standard",
                    icon: Ruler,
                  },
                  {
                    label: "Installation",
                    value: product.installationType || "DIY",
                    icon: Award,
                  },
                ].map((spec, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <spec.icon className="h-4 w-4 text-amber-500" />
                      <span className="text-muted-foreground">
                        {spec.label}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>

              {/* Additional Power Specs */}
              {(product.batteryCapacity || product.solarPanelWattage) && (
                <>
                  <Separator className="my-4" />
                  <h4 className="font-medium mb-3">Power Specifications</h4>
                  <div className="space-y-3">
                    {product.batteryCapacity && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Battery className="h-4 w-4 text-green-500" />
                          <span className="text-muted-foreground">Battery</span>
                        </div>
                        <span className="text-sm font-medium">
                          {product.batteryCapacity}
                        </span>
                      </div>
                    )}
                    {product.solarPanelWattage && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Sun className="h-4 w-4 text-amber-500" />
                          <span className="text-muted-foreground">
                            Solar Panel
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {product.solarPanelWattage}W
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mb-12">
        <Tabs defaultValue="description" className="w-full">
          {/* Container with horizontal scroll */}
          <div className="relative mb-6">
            <div className="overflow-x-auto pb-2 scrollbar-hide">
              <TabsList className="inline-flex min-w-max bg-amber-50 dark:bg-amber-950/20 px-1">
                <TabsTrigger value="description" className="whitespace-nowrap">
                  Description
                </TabsTrigger>
                <TabsTrigger
                  value="specifications"
                  className="whitespace-nowrap"
                >
                  Specifications
                </TabsTrigger>
                <TabsTrigger value="video" className="whitespace-nowrap">
                  Video Demo
                </TabsTrigger>
                <TabsTrigger value="warranty" className="whitespace-nowrap">
                  Warranty & Support
                </TabsTrigger>
              </TabsList>
            </div>
            {/* Gradient fade on mobile for scroll indication */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-gray-900 pointer-events-none sm:hidden" />
          </div>

          <TabsContent value="description" className="space-y-4">
            <Card className="border-amber-100">
              <CardContent>
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

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-amber-100">
                    <h4 className="font-medium mb-3">Product Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications">
            <Card className="border-amber-100">
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Technical Specifications */}
                  <div>
                    <h4 className="font-medium mb-4 text-lg">
                      Technical Specifications
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          {[
                            {
                              label: "SKU",
                              value:
                                displaySku ||
                                `BTE-${product.id.substring(0, 8)}`,
                            },
                            {
                              label: "Voltage",
                              value: product.voltage || "220-240V",
                            },
                            {
                              label: "Lumens",
                              value: product.lumens
                                ? `${product.lumens.toLocaleString()} lm`
                                : "N/A",
                            },
                          ].map((spec, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between border-b pb-2"
                            >
                              <span className="text-muted-foreground">
                                {spec.label}
                              </span>
                              <span className="font-medium">{spec.value}</span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3">
                          {[
                            {
                              label: "IP Rating",
                              value: product.ipRating || "IP20",
                            },
                            {
                              label: "Warranty",
                              value: product.warrantyMonths
                                ? `${product.warrantyMonths} months`
                                : "24 months",
                            },
                            {
                              label: "Weight",
                              value: product.weight
                                ? `${product.weight} kg`
                                : "N/A",
                            },
                            {
                              label: "Dimensions",
                              value: product.dimensions || "N/A",
                            },
                            {
                              label: "Installation",
                              value: product.installationType || "DIY",
                            },
                          ].map((spec, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between border-b pb-2"
                            >
                              <span className="text-muted-foreground">
                                {spec.label}
                              </span>
                              <span className="font-medium">{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Power Specifications */}
                      {(product.batteryCapacity ||
                        product.solarPanelWattage) && (
                        <div className="mt-6">
                          <h5 className="font-medium mb-3">
                            Power Specifications
                          </h5>
                          <div className="space-y-3">
                            {product.batteryCapacity && (
                              <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">
                                  Battery Capacity
                                </span>
                                <span className="font-medium">
                                  {product.batteryCapacity}
                                </span>
                              </div>
                            )}
                            {product.solarPanelWattage && (
                              <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">
                                  Solar Panel
                                </span>
                                <span className="font-medium">
                                  {product.solarPanelWattage}W
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features & Benefits */}
                  <div>
                    <h4 className="font-medium mb-4 text-lg">
                      Features & Benefits
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium mb-2 text-amber-700">
                          Key Features:
                        </h5>
                        <ul className="space-y-2">
                          {[
                            product.energySaving && "Energy Saving (Up to 80%)",
                            product.lumens &&
                              `High Brightness (${product.lumens.toLocaleString()} lm)`,
                            product.warrantyMonths &&
                              `${product.warrantyMonths}-Month Warranty`,
                            product.ipRating &&
                              `Weather Resistant (${product.ipRating})`,
                            "Long Lifespan (50,000+ hours)",
                            "Eco Friendly",
                            "Instant On",
                            "No Flickering",
                            "Low Heat Emission",
                          ]
                            .filter(Boolean)
                            .map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2 text-amber-700">
                          Benefits:
                        </h5>
                        <ul className="space-y-2">
                          {[
                            "Reduces electricity bills significantly",
                            "Perfect for home, office, and commercial use",
                            "Easy installation with detailed instructions",
                            "Safe and reliable operation",
                            "Environmentally friendly",
                            "Maintenance-free design",
                          ].map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video">
            <Card className="border-amber-100">
              <CardContent>
                {product.videoUrl ? (
                  <div className="space-y-6">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        src={product.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                        poster={product.images?.[0]}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Play className="h-5 w-5 text-amber-600" />
                          <h5 className="font-medium">Product Demo</h5>
                        </div>
                        <p className="text-sm text-gray-600">
                          Watch how this lighting product works in real-life
                          conditions
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-5 w-5 text-blue-600" />
                          <h5 className="font-medium">Installation Guide</h5>
                        </div>
                        <p className="text-sm text-gray-600">
                          Step-by-step installation instructions for easy setup
                        </p>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Volume2 className="h-5 w-5 text-green-600" />
                          <h5 className="font-medium">Expert Tips</h5>
                        </div>
                        <p className="text-sm text-gray-600">
                          Professional tips for optimal performance and
                          placement
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                      <Play className="h-10 w-10 text-amber-600" />
                    </div>
                    <h4 className="text-lg font-medium mb-2">
                      Video Demo Coming Soon
                    </h4>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      We&apos;re preparing a detailed video demonstration for
                      this product. In the meantime, check out the images and
                      specifications above.
                    </p>
                    <Button
                      variant="outline"
                      className="border-amber-300 text-amber-600"
                    >
                      Request Video Demo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="warranty">
            <Card className="border-amber-100">
              <CardContent>
                <div className="space-y-6">
                  {/* Header Banner */}
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                        {product.warrantyMonths || 24}-Month Comprehensive
                        Warranty
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        All Blessed Two Electronics products come with a
                        comprehensive {product.warrantyMonths || 24}-month
                        warranty covering manufacturing defects and premature
                        failures.
                      </p>
                    </div>
                  </div>

                  {/* Coverage & Services Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Warranty Coverage */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-lg text-gray-900 dark:text-white">
                        Warranty Coverage
                      </h5>
                      <ul className="space-y-3">
                        {[
                          "Manufacturing defects in materials and workmanship",
                          "Premature component failure under normal use",
                          "Electrical faults and connection issues",
                          "Performance below specified specifications",
                          "Premature LED failure or dimming",
                        ].map((coverage, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 p-3 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800"
                          >
                            <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {coverage}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Support Services */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-lg text-gray-900 dark:text-white">
                        Support Services
                      </h5>
                      <ul className="space-y-3">
                        {[
                          {
                            icon: Phone,
                            text: "24/7 technical support hotline",
                            border: "border-blue-100 dark:border-blue-800",
                          },
                          {
                            icon: Users,
                            text: "Free installation consultation",
                            border: "border-purple-100 dark:border-purple-800",
                          },
                          {
                            icon: Truck,
                            text: "On-site repair service in Nairobi",
                            border: "border-cyan-100 dark:border-cyan-800",
                          },
                          {
                            icon: Mail,
                            text: "Email support with 4-hour response",
                            border: "border-indigo-100 dark:border-indigo-800",
                          },
                          {
                            icon: Globe,
                            text: "Online troubleshooting guides",
                            border: "border-teal-100 dark:border-teal-800",
                          },
                        ].map((service, idx) => (
                          <li
                            key={idx}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${service.border}`}
                          >
                            <service.icon
                              className={`h-5 w-5 flex-shrink-0 mt-0.5`}
                            />
                            <span className="text-gray-700 dark:text-gray-300">
                              {service.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Quick Support Section */}
                  <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg p-6">
                    <h5 className="font-bold text-lg mb-3">
                      Need Immediate Assistance?
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
                          <Phone className="h-6 w-6" />
                        </div>
                        <p className="font-bold text-lg">0727 833 691</p>
                        <p className="text-sm opacity-90 mt-1">Call Now</p>
                        <Button
                          asChild
                          size="sm"
                          className="mt-2 bg-white text-amber-700 hover:bg-white/90"
                        >
                          <a href="tel:0727833691">Dial Now</a>
                        </Button>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
                          <Mail className="h-6 w-6" />
                        </div>
                        <p className="font-bold text-lg">support@</p>
                        <p className="text-sm opacity-90 mt-1">Email Support</p>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="mt-2 border-white text-white hover:bg-white/20"
                        >
                          <a href="mailto:support@blessedtwo.co.ke">
                            Email Now
                          </a>
                        </Button>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
                          <MapPin className="h-6 w-6" />
                        </div>
                        <p className="font-bold text-lg">Duruma Road</p>
                        <p className="text-sm opacity-90 mt-1">Visit Store</p>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="mt-2 border-white text-white hover:bg-white/20"
                        >
                          <a
                            href="https://maps.google.com/?q=Duruma+Road+Nairobi"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Get Directions
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Store Benefits Section */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                      <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      Why Shop With Blessed Two?
                    </h3>
                    <div className="space-y-3">
                      {[
                        "Nairobi's Largest Lighting Selection",
                        "Same-Day Delivery in Nairobi",
                        `${product.warrantyMonths || 24}-Month Warranty`,
                        "Free Expert Installation Available",
                        "24/7 Customer Support",
                        "Energy Saving Solutions",
                        "Professional Consultation",
                        "Bulk Order Discounts",
                      ].map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4 border-amber-200 dark:border-amber-800" />

                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Visit our store in Duruma Road, Nairobi
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button
                          asChild
                          variant="outline"
                          className="border-amber-300 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        >
                          <a href="tel:0727833691">
                            <Phone className="h-4 w-4 mr-2" />
                            Call: 0727 833 691
                          </a>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="border-amber-300 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        >
                          <a
                            href="https://wa.me/254727833691"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </a>
                        </Button>
                      </div>
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
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-6 sm:space-y-0">
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
                className="group hover:shadow-lg transition-all hover:-translate-y-1 border-amber-100 hover:border-amber-300 pt-0"
              >
                <Link href={`/products/${relatedProduct.slug}`}>
                  <div className="aspect-square relative overflow-hidden">
                    {relatedProduct.images?.[0] ? (
                      <>
                        <Image
                          src={relatedProduct.images[0]}
                          alt={relatedProduct.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110 rounded-t-lg"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        {relatedProduct.dealOfTheDay && (
                          <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 border-0 text-white text-xs">
                            🔥 Deal
                          </Badge>
                        )}
                        {relatedProduct.bestSeller && (
                          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 border-0 text-white text-xs">
                            ⭐ Best
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-600">
                          {formatCurrency(
                            relatedProduct.price,
                            relatedProduct.currency,
                          )}
                        </span>
                        {relatedProduct.wattage && (
                          <span className="text-xs text-muted-foreground">
                            {relatedProduct.wattage}W
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-xs border-amber-200"
                        >
                          {relatedProduct.category}
                        </Badge>
                        {relatedProduct.energySaving && (
                          <span className="text-xs text-green-600">
                            ⚡ Energy Saving
                          </span>
                        )}
                      </div>
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
        <CardContent className="relative">
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
                    rel="noopener noreferrer"
                  >
                    Get Directions
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white text-black hover:bg-white/20"
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
