"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { Product } from "@/types/store";
import { categoryOptions } from "@/lib/constants";

const beltLevels = [
  { id: "all", name: "All Levels" },
  { id: "white", name: "White Belt" },
  { id: "yellow", name: "Yellow Belt" },
  { id: "orange", name: "Orange Belt" },
  { id: "green", name: "Green Belt" },
  { id: "blue", name: "Blue Belt" },
  { id: "purple", name: "Purple Belt" },
  { id: "brown", name: "Brown Belt" },
  { id: "black", name: "Black Belt" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBeltLevel, setSelectedBeltLevel] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { supabase } = useAuth();

  const itemsPerPage = 5;

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from("products").select("*"); // Add select to explicitly get all columns

    if (error) {
      toast.error(`Error occurred fetching products`);
      console.error(error);
      return;
    }

    setProducts(data || []); // Fallback to empty array if data is null
  }, [supabase]); // Add supabase as dependency

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // Add fetchProducts as dependency

  // Delete product
  const deleteProduct = async (id: string, name: string) => {
    if (!id) return;

    // Add confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    const toastId = toast.loading(`Deleting ${name}...`);

    // Store the original products for rollback in case of error
    const originalProducts = [...products];

    try {
      // Optimistically remove the product from local state
      setProducts((prev) => prev.filter((product) => product.id !== id));

      // Find the product to get images (before optimistic update)
      const productToDelete = originalProducts.find(
        (product) => product.id === id
      );

      // Delete images from storage if they exist
      if (productToDelete?.images && productToDelete.images.length > 0) {
        const imagePaths = productToDelete.images
          .map((imageUrl: string) => {
            const match = imageUrl.match(/product-images\/(.+)/);
            return match ? match[1] : null;
          })
          .filter((path): path is string => path !== null);

        if (imagePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from("product-images")
            .remove(imagePaths);

          if (storageError) {
            console.warn("Failed to delete some images:", storageError);
          }
        }
      }

      // Delete the product from the database
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) {
        // Rollback optimistic update if database deletion fails
        setProducts(originalProducts);
        toast.error(`Failed to delete ${name}`, { id: toastId });
        throw error;
      }

      toast.success(`Successfully deleted ${name}`, { id: toastId });

      // Optional: You could skip the refetch since we already optimistically updated
      // fetchProducts();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete product", { id: toastId });
    }
  };

  // Filter products based on search query and filters
  const filteredProducts = products?.filter((product) => {
    // Search filter
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    // Belt level filter
    const matchesBeltLevel =
      selectedBeltLevel === "all" || product.belt_level === selectedBeltLevel;

    return matchesSearch && matchesCategory && matchesBeltLevel;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Clear filters
  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedBeltLevel("all");
    setSearchQuery("");
  };

  return (
    <div className="py-6 px-2">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-md border border-input bg-background"
          />
        </div>

        <div className="flex gap-2">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>

              <div className="py-6 space-y-6">
                {/* Categories */}
                <div>
                  <h3 className="font-medium mb-3">Categories</h3>
                  <div className="space-y-2">
                    {categoryOptions.map((category) => (
                      <div key={category.id} className="flex items-center">
                        <input
                          type="radio"
                          id={`category-${category.id}`}
                          name="category"
                          checked={selectedCategory === category.id}
                          onChange={() => setSelectedCategory(category.id)}
                          className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="ml-2 text-sm"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Belt Levels */}
                <div>
                  <h3 className="font-medium mb-3">Belt Level</h3>
                  <div className="space-y-2">
                    {beltLevels.map((level) => (
                      <div key={level.id} className="flex items-center">
                        <input
                          type="radio"
                          id={`level-${level.id}`}
                          name="beltLevel"
                          checked={selectedBeltLevel === level.id}
                          onChange={() => setSelectedBeltLevel(level.id)}
                          className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor={`level-${level.id}`}
                          className="ml-2 text-sm"
                        >
                          {level.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {(selectedCategory !== "all" ||
            selectedBeltLevel !== "all" ||
            searchQuery) && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {(selectedCategory !== "all" || selectedBeltLevel !== "all") && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategory !== "all" && (
            <div className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm">
              Category:{" "}
              {categoryOptions.find((c) => c.id === selectedCategory)?.name}
              <button
                onClick={() => setSelectedCategory("all")}
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                &times;
              </button>
            </div>
          )}

          {selectedBeltLevel !== "all" && (
            <div className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm">
              Belt: {beltLevels.find((b) => b.id === selectedBeltLevel)?.name}
              <button
                onClick={() => setSelectedBeltLevel("all")}
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-background rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Belt Level</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="truncate max-w-[200px]">
                      {product.title}
                    </div>
                  </TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>
                    {formatCurrency(product.price, product.currency)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`${
                        product.stock <= 5
                          ? "text-red-500"
                          : product.stock <= 10
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">
                    {product.category}
                  </TableCell>
                  <TableCell className="capitalize">
                    {product.belt_level}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/products/${product.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteProduct(product.id, product.name)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {paginatedProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No products found</p>
                    <Button
                      variant="link"
                      onClick={clearFilters}
                      className="mt-2"
                    >
                      Clear filters
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
              {filteredProducts.length} products
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8"
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
