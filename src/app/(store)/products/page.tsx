"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Filter,
  Sparkles,
  X,
  ShoppingCart,
  Check,
  Sun,
  Lightbulb,
  Star,
  Bolt,
  Clock,
  Tag,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/context/StoreContext";
import { Coupon, Product } from "@/types/store";
import { FloatingCartButton } from "@/components/cartButton";
import axios from "axios";
import { cn, formatCurrency } from "@/lib/utils";
import { ProductCardSkeleton } from "@/components/ProductSkeleton";
import Image from "next/image";
import { toast } from "sonner";
import { lightingCategories, lightingTags, sortOptions } from "@/lib/constants";

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; deal?: string }>;
}) {
  const { category, deal } = use(searchParams);
  const { state } = useStore();
  const orderData = state.pendingOrder;
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(category || "");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("featured");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showDealsOnly, setShowDealsOnly] = useState(Boolean(deal) || false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { dispatch } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickedStates, setClickedStates] = useState<Record<string, boolean>>(
    {}
  );
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/api/products");
      setProducts(res.data.products || []);
      setCoupons(res.data.coupons || []); // Add state for coupons
    } catch (err: any) {
      setError(err.message || "Failed to load products");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!orderData) {
      fetchProducts();
    } else {
      router.push("/checkout/payment");
    }
  }, [orderData, fetchProducts, router]);

  const handleAddToCart = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Find the product
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Set animation state
    setClickedStates((prev) => ({ ...prev, [productId]: true }));

    // Dispatch to cart
    dispatch({
      type: "ADD_TO_CART",
      payload: { product, quantity: 1 },
    });

    // Reset after animation
    setTimeout(() => {
      setClickedStates((prev) => ({ ...prev, [productId]: false }));
    }, 1500);
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      // Filter by category
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }

      // Filter by tags
      if (
        selectedTags.length > 0 &&
        !selectedTags.some((tag) => product.tags?.includes(tag))
      ) {
        return false;
      }

      // Filter by featured
      if (showFeaturedOnly && !product.featured) {
        return false;
      }

      // Filter by deals
      if (showDealsOnly && !product.isDealOfTheDay) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "rating-desc":
          return (b.rating || 0) - (a.rating || 0);
        case "deal":
          if (a.isDealOfTheDay && !b.isDealOfTheDay) return -1;
          if (!a.isDealOfTheDay && b.isDealOfTheDay) return 1;
          return 0;
        case "featured":
        default:
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
      }
    });

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedTags([]);
    setShowFeaturedOnly(false);
    setShowDealsOnly(false);
  };

  // Apply filters and close sheet
  const applyFilters = () => {
    setIsFilterOpen(false);
  };

  if (error) {
    return (
      <div className="container mx-auto px-2 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Products
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => fetchProducts()}
            className="w-full sm:w-auto cursor-pointer"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-2">
      <FloatingCartButton />

      {/* Header Section */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Blessed Two Electronics
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Duruma Road, Nairobi
              </Badge>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-3">
              Premium Lighting Solutions
            </h1>
            <p className="sm:text-lg text-muted-foreground max-w-2xl">
              Quality LED bulbs, solar lights, security lights and more. Free
              Nairobi delivery • 2-Year Warranty • Expert Installation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {filteredProducts.length} products
            </Badge>
            {products.some((p) => p.isDealOfTheDay) && (
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                <Bolt className="w-3 h-3 mr-1" />
                Hot Deals
              </Badge>
            )}
          </div>
        </div>

        <Separator className="my-6" />
      </div>

      {/* Special Offers Banner - Updated */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-1">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="hidden sm:block">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center justify-center">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {coupons.length > 0 ? (
                      <>
                        🎁 Use Coupon Code:{" "}
                        <span className="text-amber-600">
                          {coupons[0].code}
                        </span>
                        <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          {coupons[0].discount_type === "percentage"
                            ? `${coupons[0].discount_value}% OFF`
                            : `${formatCurrency(
                                coupons[0].discount_value,
                                "KES"
                              )} OFF`}
                        </span>
                      </>
                    ) : (
                      "🎁 Special Offers Available"
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {coupons.length > 0
                      ? coupons[0].description || "Limited time offer!"
                      : "Check our exclusive discounts below"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-amber-500 text-amber-600 hover:bg-amber-50 whitespace-nowrap"
                asChild
              >
                <Link href="#coupons">
                  {coupons.length > 1
                    ? `View ${coupons.length} Offers`
                    : "View Offer"}
                </Link>
              </Button>
            </div>
          </div>

          {/* Animated elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 rounded-full -translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-orange-400/20 to-red-400/20 rounded-full translate-x-16 translate-y-16" />
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {(selectedCategory ||
                  selectedTags.length > 0 ||
                  showFeaturedOnly ||
                  showDealsOnly) && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0">
                    {[
                      selectedCategory ? 1 : 0,
                      selectedTags.length,
                      showFeaturedOnly ? 1 : 0,
                      showDealsOnly ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:max-w-md overflow-y-auto mb-10"
            >
              <SheetHeader>
                <SheetTitle>Filter Lighting Products</SheetTitle>
              </SheetHeader>

              <div className="py-6 space-y-6 px-2">
                {/* Categories */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Product Categories
                  </h3>
                  <div className="space-y-2 overflow-y-auto p-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="category-all"
                        name="category"
                        checked={selectedCategory === ""}
                        onChange={() => setSelectedCategory("")}
                        className="h-4 w-4 rounded-full border-gray-300 text-amber-500 focus:ring-amber-500"
                      />
                      <label htmlFor="category-all" className="ml-2 text-sm">
                        All Products
                      </label>
                    </div>
                    {lightingCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="radio"
                          id={`category-${category.id}`}
                          name="category"
                          checked={selectedCategory === category.id}
                          onChange={() => setSelectedCategory(category.id)}
                          className="h-4 w-4 rounded-full border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="ml-2 text-sm flex items-center gap-2"
                        >
                          <category.icon className="w-4 h-4 text-amber-500" />
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Special Filters */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="featured-only"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Featured Products Only
                    </Label>
                    <Switch
                      id="featured-only"
                      checked={showFeaturedOnly}
                      onCheckedChange={setShowFeaturedOnly}
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="deals-only"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Bolt className="w-4 h-4 text-red-500" />
                      Deal of the Day Only
                    </Label>
                    <Switch
                      id="deals-only"
                      checked={showDealsOnly}
                      onCheckedChange={setShowDealsOnly}
                      className="data-[state=checked]:bg-red-500"
                    />
                  </div>
                </div>

                <Separator />

                {/* Tags */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2 h-[100%]">
                    <Tag className="w-4 h-4" />
                    Product Features
                  </h3>
                  <div className="space-y-2 overflow-y-auto">
                    {lightingTags.map((tag) => (
                      <div key={tag.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`tag-${tag.id}`}
                          checked={selectedTags.includes(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                          className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <label
                          htmlFor={`tag-${tag.id}`}
                          className="ml-2 text-sm"
                        >
                          {tag.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="flex-1"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={applyFilters}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <Badge
                variant="secondary"
                className="pl-3 pr-1 py-1 bg-amber-100 text-amber-700 border-amber-200"
              >
                {
                  lightingCategories.find((c) => c.id === selectedCategory)
                    ?.name
                }
                <button
                  onClick={() => setSelectedCategory("")}
                  className="ml-2 hover:bg-amber-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {selectedTags.map((tagId) => (
              <Badge key={tagId} variant="secondary" className="pl-3 pr-1 py-1">
                {lightingTags.find((t) => t.id === tagId)?.name}
                <button
                  onClick={() => toggleTag(tagId)}
                  className="ml-2 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {showFeaturedOnly && (
              <Badge
                variant="secondary"
                className="pl-3 pr-1 py-1 bg-blue-100 text-blue-700 border-blue-200"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Featured Only
                <button
                  onClick={() => setShowFeaturedOnly(false)}
                  className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {showDealsOnly && (
              <Badge
                variant="secondary"
                className="pl-3 pr-1 py-1 bg-red-100 text-red-700 border-red-200"
              >
                <Bolt className="w-3 h-3 mr-1" />
                Hot Deals
                <button
                  onClick={() => setShowDealsOnly(false)}
                  className="ml-2 hover:bg-red-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {(selectedCategory ||
              selectedTags.length > 0 ||
              showFeaturedOnly ||
              showDealsOnly) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 h-8 px-2"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="w-full md:w-auto">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Deal of the Day Section */}
      {products.some((p) => p.isDealOfTheDay) && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            <div className="flex items-center gap-2">
              <Bolt className="w-5 h-5 text-red-500 animate-pulse" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                ⚡ Deal of the Day
              </h3>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products
              .filter((p) => p.isDealOfTheDay)
              .slice(0, 3)
              .map((product) => (
                <div
                  key={product.id}
                  className="relative overflow-hidden rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 p-4"
                >
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse">
                      🔥{" "}
                      {Math.round(
                        (((product.originalPrice || product.price) -
                          product.price) /
                          (product.originalPrice || product.price)) *
                          100
                      )}
                      % OFF
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                      {product.images?.[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white line-clamp-2">
                        {product.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(product.price, product.currency)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(
                              product.originalPrice,
                              product.currency
                            )}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="mt-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                        asChild
                      >
                        <Link href={`/products/${product.slug}`}>
                          Grab Deal
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="absolute bottom-2 right-2">
                    <Clock className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          : filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 pt-0 border hover:border-amber-200 dark:hover:border-amber-800"
              >
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
                  {product.rating && product.rating > 0 && (
                    <div className="bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating.toFixed(1)}</span>
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
                        <Lightbulb className="h-8 w-8 text-amber-500 dark:text-amber-400" />
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
                          {lightingCategories.find(
                            (c) => c.id === product.category
                          )?.name || product.category}
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
                            {formatCurrency(
                              product.originalPrice,
                              product.currency
                            )}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={product.stock > 0 ? "outline" : "destructive"}
                      >
                        {product.stock > 0
                          ? `${product.stock} in stock`
                          : "Out of stock"}
                      </Badge>
                    </div>
                  </CardContent>
                </Link>

                <CardFooter className="pt-0">
                  <Button
                    onClick={(e) => handleAddToCart(product.id, e)}
                    className={cn(
                      "w-full transition-all duration-300 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      clickedStates[product.id] &&
                        "bg-green-500 hover:bg-green-600 m-0"
                    )}
                    disabled={product.stock === 0 || clickedStates[product.id]}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {clickedStates[product.id] ? (
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
            ))}
      </div>

      {/* Coupons Section - Updated */}
      <div id="coupons" className="mt-16 pt-8 border-t">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
            <Tag className="w-6 h-6 text-amber-500" />
            Exclusive Discount Coupons
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Save more on your lighting purchase with these special offers
          </p>
        </div>

        {coupons.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl">
            <Tag className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold mb-2">No Active Coupons</h4>
            <p className="text-muted-foreground mb-4">
              Check back soon for amazing offers!
            </p>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact us for special deals</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => {
              const discountText =
                coupon.discount_type === "percentage"
                  ? `${coupon.discount_value}% OFF`
                  : `${formatCurrency(coupon.discount_value, "KES")} OFF`;

              const minAmount =
                coupon.min_order_amount > 0
                  ? `KES ${coupon.min_order_amount.toLocaleString()}`
                  : "No minimum";

              // Calculate urgency
              const expiryDate = new Date(coupon.valid_until);
              const today = new Date();
              const daysLeft = Math.ceil(
                (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              const usageLeft = coupon.usage_limit
                ? coupon.usage_limit - (coupon.used_count || 0)
                : null;

              return (
                <div
                  key={coupon.id}
                  className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-6 hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Limited Badge */}
                  {usageLeft && usageLeft <= 10 && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs animate-pulse">
                        🔥 Only {usageLeft} left!
                      </Badge>
                    </div>
                  )}

                  {/* Urgent Badge */}
                  {daysLeft <= 3 && (
                    <div className="absolute top-12 right-4">
                      <Badge variant="destructive" className="text-xs">
                        ⏰ {daysLeft} days left!
                      </Badge>
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                          {discountText}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {coupon.description || "Special lighting offer"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Min: {minAmount}
                      </Badge>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-lg p-4 text-center mb-4 group-hover:scale-[1.02] transition-transform duration-300">
                      <div className="text-xs text-amber-600 dark:text-amber-400 mb-1 font-medium">
                        USE CODE AT CHECKOUT
                      </div>
                      <code className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                        {coupon.code}
                      </code>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span
                          className={
                            daysLeft <= 7
                              ? "text-red-500 font-bold"
                              : "text-muted-foreground"
                          }
                        >
                          {daysLeft <= 0 ? "Expired" : `${daysLeft} days left`}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-amber-500 text-amber-600 hover:bg-amber-50"
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            toast.success(
                              `Copied ${coupon.code} to clipboard!`
                            );
                          }}
                        >
                          Copy Code
                        </Button>
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                          asChild
                        >
                          <Link href="/cart">Use Now</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 pt-8 border-t text-center">
        <h3 className="text-xl font-semibold mb-4">
          Need Expert Lighting Advice?
        </h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Our lighting experts in Duruma Road can help you choose the perfect
          lighting solutions for your home or business. Visit us or schedule a
          consultation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
          >
            <Link href="/contact">Book Free Consultation</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="tel:+254700000000">
              <Phone className="w-4 h-4 mr-2" />
              Call: +254 727 833 691
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
