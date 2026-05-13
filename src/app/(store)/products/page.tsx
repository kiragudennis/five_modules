// app/(store)/products/page.tsx

"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Filter,
  X,
  Search,
  Gift,
  Target,
  Trophy,
  Ticket,
  Zap,
  Sparkles,
  Star,
  Check,
  Clock,
  Tag,
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
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/product-card";
import { LoadingSpinner } from "@/components/loading-spinner";

// Compact categories for filter sidebar
const compactCategories = [
  { id: "led-bulbs", name: "LED Bulbs", icon: "💡" },
  { id: "solar-lights", name: "Solar Lights", icon: "☀️" },
  { id: "security-lights", name: "Security", icon: "🔒" },
  { id: "decorative", name: "Decorative", icon: "✨" },
  { id: "accessories", name: "Accessories", icon: "🔌" },
];

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Top Rated" },
];

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const {
    category,
    q: initialQuery = "",
    page: initialPage = "1",
  } = use(searchParams);
  const { state, dispatch } = useStore();
  const router = useRouter();

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState(category || "");
  const [sortBy, setSortBy] = useState("popular");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Search state
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [clickedStates, setClickedStates] = useState<Record<string, boolean>>(
    {},
  );

  // Pagination & products
  const [currentPage, setCurrentPage] = useState(parseInt(initialPage));
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const memoizedProducts = useMemo(() => allProducts, [allProducts]);

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("q", searchQuery);
    if (currentPage > 1) params.set("page", currentPage.toString());
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [selectedCategory, searchQuery, currentPage]);

  // Fetch products
  const fetchProducts = useCallback(
    async (page = 1, isLoadMore = false) => {
      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        const params = new URLSearchParams({
          page: page.toString(),
          limit: "48", // Higher limit for compact grid
          ...(searchQuery && { q: searchQuery }),
          ...(selectedCategory && { category: selectedCategory }),
          ...(sortBy !== "popular" && { sort: sortBy }),
        });

        const res = await axios.get(`/api/products/search?${params}`);

        if (isLoadMore) {
          setAllProducts((prev) => [...prev, ...(res.data.products || [])]);
        } else {
          setAllProducts(res.data.products || []);
        }

        setPagination(
          res.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalProducts: 0,
            hasNextPage: false,
          },
        );
        setHasMore(res.data.pagination?.hasNextPage || false);

        // Load coupons only on initial page load without search
        if (!searchQuery && page === 1 && !isLoadMore) {
          const couponsRes = await axios.get("/api/products");
          setCoupons(couponsRes.data.coupons || []);
        }
      } catch (err: any) {
        console.error("Error fetching products:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedCategory, sortBy, searchQuery],
  );

  // Effect for filter/search changes
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [searchQuery, selectedCategory, sortBy]);

  // Load more
  const loadMoreProducts = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = pagination.currentPage + 1;
    await fetchProducts(nextPage, true);
  }, [isLoadingMore, hasMore, pagination.currentPage, fetchProducts]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || isLoadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMoreProducts();
        }
      },
      { rootMargin: "200px", threshold: 0.1 },
    );

    observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMoreProducts, isLoadingMore, hasMore]);

  // Handle add to cart
  const handleAddToCart = useCallback(
    (productId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const product = memoizedProducts.find((p) => p.id === productId);
      if (!product) return;

      setClickedStates((prev) => ({ ...prev, [productId]: true }));
      dispatch({ type: "ADD_TO_CART", payload: { product, quantity: 1 } });

      setTimeout(() => {
        setClickedStates((prev) => ({ ...prev, [productId]: false }));
      }, 1500);
    },
    [memoizedProducts, dispatch],
  );

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
    setHasMore(true);
    setAllProducts([]);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
    setAllProducts([]);
  };

  if (state.pendingOrder) {
    router.push("/checkout/payment");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <FloatingCartButton />

      {/* Compact Header with Gamification Portal */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-2 py-2">
          {/* Top Bar - Gamification Modules Portal */}
          <div className="flex items-center justify-between gap-1 mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {/* Spin Wheel Portal */}
              <Link
                href="/spin"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 hover:scale-105 transition-transform"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Target className="w-3 h-3 text-white animate-spin-slow" />
                </div>
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300 hidden sm:inline">
                  Spin
                </span>
              </Link>

              {/* Challenges Portal */}
              <Link
                href="/challenges"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 hover:scale-105 transition-transform"
              >
                <Trophy className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300 hidden sm:inline">
                  Compete
                </span>
              </Link>

              {/* Draws Portal */}
              <Link
                href="/draws"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 hover:scale-105 transition-transform"
              >
                <Ticket className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300 hidden sm:inline">
                  Lucky Draw
                </span>
              </Link>

              {/* Bundles Portal */}
              <Link
                href="/bundles"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 hover:scale-105 transition-transform"
              >
                <Gift className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300 hidden sm:inline">
                  Bundles
                </span>
              </Link>

              {/* Deals Portal */}
              <Link
                href="/deals"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 hover:scale-105 transition-transform"
              >
                <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300 hidden sm:inline">
                  Flash Sale
                </span>
              </Link>
            </div>

            {/* Product Count */}
            <div className="text-xs text-gray-400 whitespace-nowrap">
              {pagination.totalProducts > 0 && (
                <span>{pagination.totalProducts} items</span>
              )}
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search products..."
                className="w-full pl-9 pr-8 py-2 h-9 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-1 focus:ring-amber-500"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 border-gray-200 dark:border-gray-700"
                >
                  <Filter className="h-4 w-4" />
                  <span className="ml-1 text-sm hidden sm:inline">Filter</span>
                  {selectedCategory && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 w-5 p-0 text-xs"
                    >
                      1
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle>Filter Products</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-5">
                  {/* Categories */}
                  <div>
                    <h3 className="font-medium text-sm mb-2">Categories</h3>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === ""}
                          onChange={() => setSelectedCategory("")}
                          className="w-3.5 h-3.5"
                        />
                        <span>All Products</span>
                      </label>
                      {compactCategories.map((cat) => (
                        <label
                          key={cat.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === cat.id}
                            onChange={() => setSelectedCategory(cat.id)}
                            className="w-3.5 h-3.5"
                          />
                          <span>
                            {cat.icon} {cat.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Sort */}
                  <div>
                    <h3 className="font-medium text-sm mb-2">Sort By</h3>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort Dropdown (Desktop) */}
            <div className="hidden md:block w-36">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid - Compact like Kilimall/Jumia */}
      <div className="container mx-auto px-2 py-3">
        {/* Active Filter Indicator */}
        {selectedCategory && (
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs py-0.5">
              {compactCategories.find((c) => c.id === selectedCategory)?.name ||
                selectedCategory}
              <button
                onClick={() => setSelectedCategory("")}
                className="ml-1.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs h-6 px-2 text-gray-500"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Compact Grid - 2/4/5/6 columns responsive */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 sm:gap-2">
          {isLoading && !isLoadingMore
            ? Array.from({ length: 48 }).map((_, i) => (
                <CompactProductSkeleton key={i} />
              ))
            : memoizedProducts.map((product) => (
                <CompactProductCard
                  key={`${product.id}`}
                  product={product}
                  isClicked={clickedStates[product.id] || false}
                  onAddToCart={handleAddToCart}
                />
              ))}
        </div>
        {/* Coupons Section */}
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

                const expiryDate = new Date(coupon.valid_until);
                const today = new Date();
                const daysLeft = Math.ceil(
                  (expiryDate.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                const usageLeft = coupon.usage_limit
                  ? coupon.usage_limit - (coupon.used_count || 0)
                  : null;

                return (
                  <div
                    key={coupon.id}
                    className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-6 hover:shadow-lg transition-all duration-300 group"
                  >
                    {usageLeft && usageLeft <= 10 && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs animate-pulse">
                          🔥 Only {usageLeft} left!
                        </Badge>
                      </div>
                    )}

                    {daysLeft <= 3 && (
                      <div className="absolute top-4 right-32">
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
                        <Badge variant="outline" className="text-xs mt-6">
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
                            {daysLeft <= 0
                              ? "Expired"
                              : `${daysLeft} days left`}
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
                                `Copied ${coupon.code} to clipboard!`,
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

        {/* Infinite Scroll Trigger */}
        <div ref={loadMoreRef} className="py-4">
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          )}
          {!hasMore && memoizedProducts.length > 0 && (
            <p className="text-center text-xs text-gray-400 py-4">
              No more products
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact Product Skeleton
function CompactProductSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
      <div className="p-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-1.5 w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    </div>
  );
}

// Compact Product Card Component
function CompactProductCard({
  product,
  isClicked,
  onAddToCart,
}: {
  product: Product;
  isClicked: boolean;
  onAddToCart: (productId: string, e: React.MouseEvent) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 block"
    >
      {/* Image Container - Compact */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
        {product.images?.[0] && !imgError ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 20vw, 16vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-gray-300" />
          </div>
        )}

        {/* Deal Badge - Small */}
        {product.isDealOfTheDay && (
          <div className="absolute top-1 left-1">
            <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              🔥 Deal
            </div>
          </div>
        )}

        {/* Rating - Compact */}
        {product.rating > 0 && (
          <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-1 py-0.5 rounded flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            <span>{product.rating}</span>
          </div>
        )}
      </div>

      {/* Product Info - Compact */}
      <div className="p-2">
        <h3 className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2 min-h-[32px]">
          {product.title}
        </h3>

        {/* Price */}
        <div className="mt-1.5">
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(product.price, product.currency)}
          </span>
          {product.originalPrice && (
            <span className="text-[10px] text-gray-400 line-through ml-1">
              {formatCurrency(product.originalPrice, product.currency)}
            </span>
          )}
        </div>

        {/* Add to Cart Button - Tiny */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCart(product.id, e);
          }}
          disabled={product.stock <= 0 || isClicked}
          className={cn(
            "w-full mt-2 py-1 rounded text-xs font-medium transition-all duration-200",
            product.stock > 0 && !isClicked
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : isClicked
                ? "bg-green-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed",
          )}
        >
          {isClicked ? (
            <Check className="h-3 w-3 mx-auto" />
          ) : product.stock > 0 ? (
            "Add"
          ) : (
            "Out"
          )}
        </button>
      </div>
    </Link>
  );
}

// Add this to your globals.css for slow spin animation
// @keyframes spin-slow {
//   from { transform: rotate(0deg); }
//   to { transform: rotate(360deg); }
// }
// .animate-spin-slow {
//   animation: spin-slow 3s linear infinite;
// }
