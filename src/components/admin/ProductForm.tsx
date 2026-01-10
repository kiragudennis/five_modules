// @ts-nocheck

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Weight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./ImageUpload";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { getCurrencyOptions } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { categoryOptions } from "@/lib/constants";
import { TagInput } from "../tag-input";

// Product schema
const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  title: z.string().min(10, "Title must be at least 10 characters."),
  sku: z.string().min(2, "SKU must be at least 2 characters."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
  slug: z.string().min(3, "Slug must be at least 10 characters."),
  images: z.array(z.string()).optional(),
  price: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().min(0, "Price must be a positive number.")
  ),
  originalPrice: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().min(0, "Original price must be a positive number.")
  ),
  stock: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().int().min(0, "Stock must be a non-negative integer.")
  ),
  category: z.string().min(1, "Please select a category."),
  belt_level: z.string(),
  currency: z.string(),
  tags: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  weight: z
    .preprocess((val) => {
      if (val === "" || val === null) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : Number(num.toFixed(2)); // force 2 decimals
    }, z.number().min(0, "Weight must be a non-negative number."))
    .optional()
    .default(0),
});

// Belt level options
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

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: ProductFormValues & { id?: string };
  isEditing?: boolean;
}

export default function ProductForm({
  initialData,
  isEditing = false,
}: ProductFormProps) {
  const router = useRouter();
  const { supabase } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values or initial data
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: "",
      title: "",
      sku: "",
      description: "",
      slug: "",
      images: [],
      price: 0,
      originalPrice: 0,
      stock: 0,
      category: "",
      belt_level: "all",
      currency: "KES",
      tags: [],
      featured: false,
      Weight: 0,
    },
  });

  // Watch the name field and generate slug automatically
  const titleValue = form.watch("title");

  useEffect(() => {
    if (titleValue && !isEditing) {
      // Only auto-generate for new products
      const generatedSlug = titleValue
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/-+/g, "-");

      form.setValue("slug", generatedSlug);
    }
  }, [titleValue, form, isEditing]);

  // Form submission handler
  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);

    try {
      const productData = {
        ...values,
        price: Number(values.price),
        originalPrice:
          Number(values.originalPrice) > 0
            ? Number(values.originalPrice)
            : null,
        stock: Number(values.stock),
        tags: values.tags || [],
        images: values.images || [],
      };

      let result;
      if (isEditing && initialData?.id) {
        result = await supabase
          .from("products")
          .update(productData)
          .eq("id", initialData.id)
          .select();
      } else {
        result = await supabase.from("products").insert([productData]).select();
      }

      if (result.error) throw result.error;

      router.push("/admin/products");
      router.refresh();
      toast.success(isEditing ? "Product updated" : "Product created");
    } catch (error: any) {
      console.error("Error saving product:", error);

      // Clean up any uploaded images if the product creation failed
      if (values.images && values.images.length > 0) {
        try {
          const imagePaths = values.images.map((url) => {
            const urlParts = url.split("/");
            return urlParts
              .slice(urlParts.indexOf("product-images") + 1)
              .join("/");
          });

          await supabase.storage.from("product-images").remove(imagePaths);
        } catch (cleanupError) {
          console.error("Error cleaning up images:", cleanupError);
        }
      }

      toast.error(error.message || "Error saving product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Elite Gi"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Title</FormLabel>
                <FormControl>
                  <Input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Premium Gi"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SKU */}
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="KG-001"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Unique product identifier</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-5 -translate-y-1/2 text-muted-foreground">
                      KES
                    </span>
                    <Input
                      step="0.01"
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="1500"
                      {...field}
                      type="number"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Original Price */}
          <FormField
            control={form.control}
            name="originalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Price</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-5 -translate-y-1/2 text-muted-foreground">
                      KES
                    </span>
                    <Input
                      step="0.01"
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                      type="number"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stock */}
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="10"
                    type="number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Belt Level */}
          {/* <FormField
            control={form.control}
            name="belt_level"
            disabled
            render={({ field }) => (
              <FormItem>
                <FormLabel>Belt Level</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a belt level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {beltLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getCurrencyOptions().map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Weight */}
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-5 -translate-y-1/2 text-muted-foreground">
                      <Weight size={16} />
                    </span>
                    <Input
                      step="0.01"
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="0.5"
                      {...field}
                      type="number"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Featured */}
          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel>Featured</FormLabel>
                  <FormDescription>
                    Mark product as featured on the homepage
                  </FormDescription>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter product description..."
                  className="min-h-32 resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags Field */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (max {5})</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value || []}
                  onChange={field.onChange}
                  category={form.watch("category")} // Watch category for filtering
                  placeholder="Type to add tags..."
                  maxTags={5}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Images</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value || []}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="mr-2"
            onClick={() => router.push("/admin/products")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Update Product"
            ) : (
              "Create Product"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
