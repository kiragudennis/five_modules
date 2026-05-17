// app/(store)/page.tsx - COMPLETE HOMEPAGE WITH EVERYTHING

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Gift,
  Target,
  Trophy,
  Ticket,
  Zap,
  Sparkles,
  Star,
  Check,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Tag,
  Smartphone,
  WashingMachine,
  Shirt,
  ChefHat,
  Sofa,
  Grid3x3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/context/StoreContext";
import { Coupon, Product } from "@/types/store";
import { FloatingCartButton } from "@/components/cartButton";
import axios from "axios";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { scrollableCategories } from "@/lib/constants";

// Banner slides
const banners = [
  {
    id: 1,
    title: "Flash Sale! Up to 70% OFF",
    subtitle: "Limited time offer on electronics & appliances",
    cta: "Shop Now",
    bgColor: "from-red-500 to-orange-500",
  },
  {
    id: 2,
    title: "Free Delivery on Orders Over KES 5,000",
    subtitle: "Nairobi & Mombasa only",
    cta: "Shop Now",
    bgColor: "from-blue-500 to-cyan-500",
  },
  {
    id: 3,
    title: "New Arrivals",
    subtitle: "Check out the latest products",
    cta: "Explore",
    bgColor: "from-purple-500 to-pink-500",
  },
];

// Gamified Experiences + Category Icons (5 columns × 2 rows)
const gamifiedModules = [
  {
    id: "spin",
    name: "Spin & Win",
    icon: <Target className="w-6 h-6" />,
    href: "/spin",
    color: "from-purple-500 to-pink-500",
    gradient: "purple",
  },
  {
    id: "challenges",
    name: "Challenges",
    icon: <Trophy className="w-6 h-6" />,
    href: "/challenges",
    color: "from-orange-500 to-red-500",
    gradient: "orange",
  },
  {
    id: "draws",
    name: "Lucky Draw",
    icon: <Ticket className="w-6 h-6" />,
    href: "/draws",
    color: "from-blue-500 to-cyan-500",
    gradient: "blue",
  },
  {
    id: "bundles",
    name: "Mystery Bundles",
    icon: <Gift className="w-6 h-6" />,
    href: "/bundles",
    color: "from-green-500 to-emerald-500",
    gradient: "green",
  },
  {
    id: "deals",
    name: "Flash Sales",
    icon: <Zap className="w-6 h-6" />,
    href: "/deals",
    color: "from-amber-500 to-yellow-500",
    gradient: "amber",
  },
  {
    id: "electronics",
    name: "Electronics",
    icon: <Smartphone className="w-6 h-6" />,
    href: "/products?category=electronics",
    color: "bg-blue-100 text-blue-600",
    isCategory: true,
  },
  {
    id: "appliances",
    name: "Appliances",
    icon: <WashingMachine className="w-6 h-6" />,
    href: "/products?category=home-appliances",
    color: "bg-cyan-100 text-cyan-600",
    isCategory: true,
  },
  {
    id: "fashion",
    name: "Fashion",
    icon: <Shirt className="w-6 h-6" />,
    href: "/products?category=fashion",
    color: "bg-pink-100 text-pink-600",
    isCategory: true,
  },
  {
    id: "kitchen",
    name: "Kitchen",
    icon: <ChefHat className="w-6 h-6" />,
    href: "/products?category=kitchen",
    color: "bg-amber-100 text-amber-600",
    isCategory: true,
  },
  {
    id: "furniture",
    name: "Furniture",
    icon: <Sofa className="w-6 h-6" />,
    href: "/products?category=furniture",
    color: "bg-emerald-100 text-emerald-600",
    isCategory: true,
  },
];

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Top Rated" },
];

// ============================================
// MAIN HOMEPAGE COMPONENT
// ============================================

export default function HomePage() {
  const router = useRouter();
  const { dispatch } = useStore();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Products state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
  });

  // Banner slider state
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Click states for add to cart
  const [clickedStates, setClickedStates] = useState<Record<string, boolean>>(
    {},
  );

  // Infinite scroll ref
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
          limit: "48",
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

        // Load coupons only on initial load without search
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
    setAllProducts([]);
    setHasMore(true);
    fetchProducts(1, false);
  }, [searchQuery, selectedCategory, sortBy, fetchProducts]);

  // Load more products
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

  // Banner auto-slide
  useEffect(() => {
    bannerIntervalRef.current = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => {
      if (bannerIntervalRef.current) clearInterval(bannerIntervalRef.current);
    };
  }, []);

  // Handle add to cart
  const handleAddToCart = useCallback(
    (productId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const product = allProducts.find((p) => p.id === productId);
      if (!product) return;

      setClickedStates((prev) => ({ ...prev, [productId]: true }));
      dispatch({ type: "ADD_TO_CART", payload: { product, quantity: 1 } });

      setTimeout(() => {
        setClickedStates((prev) => ({ ...prev, [productId]: false }));
      }, 1500);

      toast.success(`Added ${product.title.substring(0, 30)} to cart`);
    },
    [allProducts, dispatch],
  );

  const handleSearch = () => {
    if (searchInput.trim()) {
      setSearchQuery(searchInput);
      setAllProducts([]);
    }
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchInput("");
    setSearchQuery("");
    setSortBy("popular");
    setAllProducts([]);
  };

  const scrollCategories = (direction: "left" | "right") => {
    const container = document.getElementById("categories-container");
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const goToBanner = (index: number) => {
    setCurrentBanner(index);
    if (bannerIntervalRef.current) {
      clearInterval(bannerIntervalRef.current);
      bannerIntervalRef.current = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <FloatingCartButton />

      {/* ============================================ */}
      {/* STICKY HEADER WITH SEARCH & FILTERS */}
      {/* ============================================ */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search for products, brands, categories..."
                className="w-full pl-10 pr-4 py-6 text-base border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
              <Button
                onClick={handleSearch}
                size="sm"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 px-6 rounded-xl"
              >
                Search
              </Button>
            </div>

            {/* Filter Button (Mobile) */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="md:hidden px-4 rounded-xl"
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>Filter Products</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-5">
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
                      {scrollableCategories.map((cat) => (
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
                  <div>
                    <h3 className="font-medium text-sm mb-2">Sort By</h3>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full">
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
          </div>

          {/* Filter Bar (Desktop) */}
          <div className="hidden md:flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Grid3x3 className="h-4 w-4" />
                Filter by:
              </span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 h-8 text-sm">
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
              {selectedCategory && (
                <Badge variant="secondary" className="text-xs">
                  Category:{" "}
                  {
                    scrollableCategories.find((c) => c.id === selectedCategory)
                      ?.name
                  }
                  <button
                    onClick={() => setSelectedCategory("")}
                    className="ml-1"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              )}
              {(selectedCategory || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-7"
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="text-sm text-gray-400">
              {pagination.totalProducts > 0 &&
                `${pagination.totalProducts} products found`}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* HORIZONTAL SCROLLABLE CATEGORIES */}
      {/* ============================================ */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <div className="relative">
            <button
              onClick={() => scrollCategories("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full shadow-md p-1.5 border border-gray-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div
              id="categories-container"
              className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {scrollableCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all duration-200",
                    selectedCategory === category.id
                      ? "bg-amber-50 dark:bg-amber-950/50 ring-2 ring-amber-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                      category.color,
                    )}
                  >
                    {category.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => scrollCategories("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full shadow-md p-1.5 border border-gray-200"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* LANDSCAPE SLIDESHOW BANNERS */}
      {/* ============================================ */}
      <div className="container mx-auto px-4 py-4">
        <div className="relative rounded-2xl overflow-hidden h-[240px] md:h-[300px] lg:h-[360px]">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={cn(
                "absolute inset-0 transition-all duration-500 ease-in-out",
                index === currentBanner
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-full",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-r",
                  banner.bgColor,
                )}
              />
              <div className="absolute inset-0 flex items-center justify-between px-8 md:px-16 z-10">
                <div className="text-white">
                  <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-2">
                    {banner.title}
                  </h2>
                  <p className="text-sm md:text-base mb-4 opacity-90">
                    {banner.subtitle}
                  </p>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="rounded-full"
                    asChild
                  >
                    <Link href="/products">{banner.cta}</Link>
                  </Button>
                </div>
                <div className="hidden md:block w-40 h-40 relative">
                  <div className="w-full h-full bg-white/20 rounded-2xl flex items-center justify-center text-5xl">
                    🛍️
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToBanner(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentBanner
                    ? "w-8 bg-white"
                    : "bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
          <button
            onClick={() =>
              goToBanner((currentBanner - 1 + banners.length) % banners.length)
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goToBanner((currentBanner + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* GAMIFIED EXPERIENCES + CATEGORY GRID (5x2) */}
      {/* ============================================ */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {gamifiedModules.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className={cn(
                "group flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg",
                module.isCategory
                  ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-amber-300"
                  : cn(
                      "bg-gradient-to-br text-white",
                      module.gradient === "purple" &&
                        "from-purple-500 to-pink-500",
                      module.gradient === "orange" &&
                        "from-orange-500 to-red-500",
                      module.gradient === "blue" && "from-blue-500 to-cyan-500",
                      module.gradient === "green" &&
                        "from-green-500 to-emerald-500",
                      module.gradient === "amber" &&
                        "from-amber-500 to-yellow-500",
                    ),
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  module.isCategory
                    ? "bg-gray-100 dark:bg-gray-700 shadow-md"
                    : "bg-white/20 backdrop-blur-sm",
                )}
              >
                <div
                  className={
                    module.isCategory
                      ? "text-gray-700 dark:text-gray-200"
                      : "text-white"
                  }
                >
                  {module.icon}
                </div>
              </div>
              <span
                className={cn(
                  "text-sm font-medium text-center",
                  module.isCategory
                    ? "text-gray-700 dark:text-gray-300"
                    : "text-white",
                )}
              >
                {module.name}
              </span>
              {!module.isCategory && (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-white/20 text-white border-0 mt-1"
                >
                  Play Now →
                </Badge>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* PRODUCTS GRID */}
      {/* ============================================ */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {searchQuery
              ? `Results for "${searchQuery}"`
              : "Recommended for you"}
          </h2>
          {pagination.totalProducts > 0 && (
            <span className="text-sm text-gray-400">
              {pagination.totalProducts} products
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {isLoading && !isLoadingMore
            ? Array.from({ length: 24 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : allProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isClicked={clickedStates[product.id] || false}
                  onAddToCart={handleAddToCart}
                />
              ))}
        </div>

        {/* Infinite Scroll Trigger */}
        <div ref={loadMoreRef} className="py-6">
          {isLoadingMore && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          )}
          {!hasMore && allProducts.length > 0 && (
            <p className="text-center text-sm text-gray-400 py-4">
              You've reached the end
            </p>
          )}
          {!isLoading && allProducts.length === 0 && !searchQuery && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* COUPONS SECTION */}
      {/* ============================================ */}
      {coupons.length > 0 && (
        <div className="container mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Exclusive Coupons
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.slice(0, 3).map((coupon) => {
              const discountText =
                coupon.discount_type === "percentage"
                  ? `${coupon.discount_value}% OFF`
                  : `${formatCurrency(coupon.discount_value, "KES")} OFF`;
              return (
                <Card
                  key={coupon.id}
                  className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge className="bg-amber-500 text-white">
                          {discountText}
                        </Badge>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {coupon.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          toast.success(`Copied ${coupon.code}`);
                        }}
                      >
                        Copy Code
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Min. spend: KES{" "}
                      {coupon.min_order_amount?.toLocaleString() || 0}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PRODUCT CARD COMPONENT
// ============================================

function ProductCard({
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
      className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 block border border-gray-100 dark:border-gray-700"
    >
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
            <Sparkles className="h-8 w-8 text-gray-300" />
          </div>
        )}
        {product.isDealOfTheDay && (
          <div className="absolute top-2 left-2">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" /> Deal
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 min-h-[40px]">
          {product.title}
        </h3>
        <div className="mt-2">
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(product.price, product.currency)}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through ml-2">
              {formatCurrency(product.originalPrice, product.currency)}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCart(product.id, e);
          }}
          disabled={product.stock <= 0 || isClicked}
          className={cn(
            "w-full mt-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            product.stock > 0 && !isClicked
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : isClicked
                ? "bg-green-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed",
          )}
        >
          {isClicked ? (
            <span className="flex items-center justify-center gap-1">
              <Check className="h-4 w-4" /> Added!
            </span>
          ) : product.stock > 0 ? (
            "Add to Cart"
          ) : (
            "Out of Stock"
          )}
        </button>
      </div>
    </Link>
  );
}

// Product Card Skeleton
function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
      <div className="p-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mt-3" />
      </div>
    </div>
  );
}

// Add to globals.css:
// .scrollbar-hide::-webkit-scrollbar { display: none; }
// .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
