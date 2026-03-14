"use client";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Filter,
  Sparkles,
  X,
  Lightbulb,
  Bolt,
  Clock,
  Tag,
  Phone,
  Search,
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
import { lightingCategories, lightingTags, sortOptions } from "@/lib/constants";
import ProductCard from "@/components/product-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Input } from "@/components/ui/input";

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    deal?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const {
    category,
    deal,
    q: initialQuery = "",
    page: initialPage = "1",
  } = use(searchParams);
  const { state } = useStore();
  const orderData = state.pendingOrder;
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(category || "");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showDealsOnly, setShowDealsOnly] = useState(Boolean(deal) || false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { dispatch } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [clickedStates, setClickedStates] = useState<Record<string, boolean>>(
    {},
  );
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Search state
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(parseInt(initialPage));
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 24,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const memoizedProducts = useMemo(() => allProducts, [allProducts]);

  // Sync URL with current state
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("q", searchQuery);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (showDealsOnly) params.set("deal", "true");

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [selectedCategory, searchQuery, currentPage, showDealsOnly]);

  // Handle search button click
  const handleSearchClick = useCallback(() => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
    setHasMore(true);
    setAllProducts([]); // Clear existing products for new search
  }, [searchInput]);

  // Handle Enter key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearchClick();
      }
    },
    [handleSearchClick],
  );

  // Fetch products function
  const fetchProducts = useCallback(
    async (page = 1, isLoadMore = false) => {
      const controller = new AbortController();
      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoadingSearch(true);
        }

        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: "24",
          ...(searchQuery && { q: searchQuery }),
          ...(selectedCategory && { category: selectedCategory }),
          ...(selectedTags.length > 0 && { tags: selectedTags.join(",") }),
          ...(showFeaturedOnly && { featured: "true" }),
          ...(showDealsOnly && { deals: "true" }),
          ...(sortBy && { sort: sortBy }),
        });

        const res = await axios.get(`/api/products/search?${params}`, {
          signal: controller.signal,
        });

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
            limit: 24,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        );

        setHasMore(res.data.pagination?.hasNextPage || false);

        // Load coupons only on initial page load without search
        if (!searchQuery && page === 1 && !isLoadMore) {
          const couponsRes = await axios.get("/api/products");
          setCoupons(couponsRes.data.coupons || []);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("Request cancelled");
          return;
        }
        setError(err.message || "Failed to load products");
        console.error("Error fetching products:", err);
      } finally {
        setIsLoadingSearch(false);
        setIsLoadingMore(false);
      }
      return () => controller.abort();
    },
    [
      selectedCategory,
      selectedTags,
      showFeaturedOnly,
      showDealsOnly,
      sortBy,
      searchQuery,
    ],
  );

  // Effect for search and filter changes
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [
    searchQuery,
    selectedCategory,
    selectedTags,
    showFeaturedOnly,
    showDealsOnly,
    sortBy,
  ]);

  // Load more products function
  const loadMoreProducts = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    const nextPage = pagination.currentPage + 1;
    await fetchProducts(nextPage, true);
  }, [isLoadingMore, hasMore, pagination.currentPage, fetchProducts]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || isLoadingMore || !hasMore) return;

    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoadingMore && hasMore) {
        loadMoreProducts();
      }
    }, options);

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreProducts, isLoadingMore, hasMore]);

  // Handle add to cart
  const handleAddToCart = useCallback(
    (productId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const product = memoizedProducts.find((p) => p.id === productId);
      if (!product) return;

      setClickedStates((prev) => ({ ...prev, [productId]: true }));

      dispatch({
        type: "ADD_TO_CART",
        payload: { product, quantity: 1 },
      });

      setTimeout(() => {
        setClickedStates((prev) => ({ ...prev, [productId]: false }));
      }, 1500);
    },
    [memoizedProducts, dispatch],
  );

  // Clear search
  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedTags([]);
    setShowFeaturedOnly(false);
    setShowDealsOnly(false);
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
    setAllProducts([]);
    setHasMore(true);
  };

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  };

  // Apply filters and close sheet
  const applyFilters = () => {
    setIsFilterOpen(false);
  };

  // Load initial products
  useEffect(() => {
    if (!orderData) {
      fetchProducts();
    } else {
      router.push("/checkout/payment");
    }
  }, [orderData]);

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
                Blessed Two Electricals
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
              {allProducts.length} products
            </Badge>
            {allProducts.some((p) => p.isDealOfTheDay) && (
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
                                "KES",
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

      {/* Filter and Sort Bar with Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        {/* Search Bar */}
        <div className="w-full md:max-w-md">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Search products by name, description, or features..."
                className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
              />
              {searchInput && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearchClick}
              disabled={isLoadingSearch || !searchInput}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white whitespace-nowrap"
            >
              {isLoadingSearch ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </div>
              )}
            </Button>
          </div>

          {/* Search status */}
          {searchQuery && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Found {pagination.totalProducts} products for "{searchQuery}"
              </p>
            </div>
          )}
        </div>

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
      {allProducts.some((p) => p.isDealOfTheDay) && (
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
            {allProducts
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
                          100,
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
                              product.currency,
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
      <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
        {isLoadingSearch
          ? Array.from({ length: 24 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          : allProducts.map((product) => (
              <ProductCard
                key={`${product.id}-${product.created_at}`}
                product={product}
                isClicked={clickedStates[product.id] || false}
                onAddToCart={handleAddToCart}
                isInStock={product.stock > 0}
              />
            ))}
      </div>

      {/* Infinite Scroll Loader */}
      <div ref={loadMoreRef} className="py-8">
        {isLoadingMore && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <LoadingSpinner />
            <p className="text-sm text-gray-500">Loading more products...</p>
          </div>
        )}

        {!hasMore && allProducts.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No more products to load</p>
          </div>
        )}
      </div>

      {/* Show total count */}
      {allProducts.length > 0 && !isLoadingSearch && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Showing {allProducts.length} of {pagination.totalProducts} products
          </p>
        </div>
      )}

      {/* Manual Load More Button */}
      {hasMore && !isLoadingMore && allProducts.length > 0 && (
        <div className="text-center py-8">
          <Button
            onClick={loadMoreProducts}
            variant="outline"
            className="cursor-pointer"
          >
            Load More Products
          </Button>
        </div>
      )}

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
