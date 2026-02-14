// @ts-nocheck
// This component is a comprehensive form for creating and editing lighting products in the admin dashboard. It includes fields for product information, pricing, stock, category, features, and technical specifications. The form uses react-hook-form for state management and validation with zod. It also integrates with Supabase for data persistence and provides a user-friendly interface with dynamic fields based on the selected category.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Loader2,
  Weight,
  Zap,
  Battery,
  Sun,
  Shield,
  Ruler,
  Users,
  Package,
} from "lucide-react";

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
import { VideoUpload } from "./VideoUpload";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { lightingCategories, lightingTags } from "@/lib/constants";
import { TagInput } from "../tag-input";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Card, CardContent } from "../ui/card";
import { productSchema } from "@/types/store";
import { VarietiesManager } from "./VarietiesManager";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("");

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
      videoUrl: "",
      price: 0,
      originalPrice: 0,
      stock: 0,
      category: "",
      wattage: 0,
      voltage: "220-240V",
      colorTemperature: "",
      lumens: 0,
      warrantyMonths: 24,
      batteryCapacity: "",
      solarPanelWattage: 0,
      dimensions: "",
      ipRating: "",
      currency: "KES",
      tags: [],
      featured: false,
      dealOfTheDay: false,
      bestSeller: false,
      energySaving: false,
      weight: 0,
      installationType: "DIY",
      referral_points: 0,
      has_wholesale: false,
      has_varieties: false,
      wholesale_price: 0,
      wholesale_min_quantity: 0,
    },
  });

  // Watch the title field and generate slug automatically
  const titleValue = form.watch("title");
  console.log("Form Errors:", form.formState.errors);

  useEffect(() => {
    if (titleValue && !isEditing) {
      const generatedSlug = titleValue
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/-+/g, "-");

      form.setValue("slug", generatedSlug);
    }
  }, [titleValue, form, isEditing]);

  // Watch category for dynamic fields
  const categoryValue = form.watch("category");
  useEffect(() => {
    setSelectedCategory(categoryValue);
  }, [categoryValue]);

  // Technical specifications based on category
  const getCategorySpecs = (category: string) => {
    const specs: { [key: string]: boolean } = {
      showWattage: true,
      showVoltage: true,
      showLumens: true,
      showBattery: category.includes("solar") || category.includes("emergency"),
      showSolarPanel: category.includes("solar"),
      showIPRating:
        category.includes("outdoor") || category.includes("security"),
      showColorTemp: true,
      showDimensions: true,
    };
    return specs;
  };

  const categorySpecs = getCategorySpecs(selectedCategory);

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
        wattage: values.wattage || null,
        lumens: values.lumens || null,
        solarPanelWattage: values.solarPanelWattage || null,
        weight: values.weight || 0,
        tags: values.tags || [],
        images: values.images || [],
        videoUrl: values.videoUrl || null,
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

        // Handle varieties if enabled
        if (values.has_varieties && result.data) {
          // Delete existing varieties
          await supabase
            .from("product_varieties")
            .delete()
            .eq("product_id", result.data.id);

          // Insert new varieties
          if (values.varieties && values.varieties.length > 0) {
            const { error: varietiesError } = await supabase
              .from("product_varieties")
              .insert(
                values.varieties.map((variety) => ({
                  product_id: product.id,
                  name: variety.name,
                  sku: variety.sku,
                  price: variety.price,
                  original_price: variety.original_price,
                  stock: variety.stock,
                  images: variety.images || [],
                  attributes: variety.attributes,
                  is_default: variety.is_default,
                })),
              );

            if (varietiesError) throw varietiesError;
          }
        }
      }

      if (result.error) throw result.error;

      router.push("/admin/products");
      router.refresh();
      toast.success(
        isEditing
          ? "Product updated successfully"
          : "Product created successfully",
      );
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Error saving product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Technical specifications options
  const voltageOptions = ["110V", "220-240V", "12V", "24V", "48V"];
  const colorTemperatureOptions = [
    "2700K (Warm White)",
    "3000K (Soft White)",
    "4000K (Cool White)",
    "5000K (Daylight)",
    "6500K (Cool Daylight)",
    "RGB (Multi Color)",
  ];
  const ipRatingOptions = [
    "IP20 (Indoor)",
    "IP44 (Splash Proof)",
    "IP65 (Water Resistant)",
    "IP67 (Waterproof)",
    "IP68 (Submersible)",
  ];
  const installationOptions = ["DIY", "Professional Required", "Plug & Play"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? "Edit Lighting Product" : "New Lighting Product"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {isEditing
              ? "Update your lighting product details"
              : "Fill in the details for your new lighting product"}
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
        >
          <Zap className="w-3 h-3 mr-1" />
          Blessed Two Electronics
        </Badge>
      </div>

      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Product Information Card */}
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Product Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 20W LED Solar Street Light"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Short product name</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Premium 20W Solar Street Light with Motion Sensor"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Detailed product title for display
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., BTE-SL20W-M"
                              {...field}
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            Unique stock keeping unit
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Slug *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 20w-led-solar-street-light"
                              {...field}
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            URL-friendly identifier
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price (KES) *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1.5 text-muted-foreground">
                              KES
                            </span>
                            <Input
                              className="pl-12"
                              placeholder="2499"
                              {...field}
                              type="number"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="originalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Price (KES)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1.5 text-muted-foreground">
                              KES
                            </span>
                            <Input
                              className="pl-12"
                              placeholder="2999"
                              {...field}
                              type="number"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity *</FormLabel>
                        <FormControl>
                          <Input placeholder="50" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">
                              <Weight size={16} />
                            </span>
                            <Input
                              className="pl-10"
                              placeholder="2.5"
                              {...field}
                              type="number"
                              step="0.01"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wholesale Pricing Card */}
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Wholesale Pricing
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="has_wholesale"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            // Reset wholesale fields when unchecked
                            if (!checked) {
                              form.setValue("wholesale_price", null);
                              form.setValue("wholesale_min_quantity", 10);
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable Wholesale Pricing</FormLabel>
                        <FormDescription>
                          Offer special prices for bulk purchases
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("has_wholesale") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/10">
                    <FormField
                      control={form.control}
                      name="wholesale_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wholesale Price (KES) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground">
                                <Package size={16} />
                              </span>
                              <Input
                                className="pl-10"
                                placeholder="1999"
                                {...field}
                                type="number"
                                min="0"
                                step="0.01"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value =
                                    e.target.value === ""
                                      ? 0
                                      : parseFloat(e.target.value);
                                  field.onChange(isNaN(value) ? 0 : value);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Price per unit for wholesale orders
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="wholesale_min_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Quantity *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground">
                                <Users size={16} />
                              </span>
                              <Input
                                className="pl-10"
                                placeholder="10"
                                {...field}
                                type="number"
                                min="0"
                                step="1"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value =
                                    e.target.value === ""
                                      ? 0
                                      : parseInt(e.target.value, 10);
                                  field.onChange(isNaN(value) ? 0 : value);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Minimum units required for wholesale price
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="col-span-full">
                      <div className="text-sm text-purple-700 dark:text-purple-300 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                        <p className="font-medium">
                          Wholesale pricing summary:
                        </p>
                        <p>
                          Customers who order{" "}
                          {form.watch("wholesale_min_quantity") || 0}+ units
                          will get each unit at KES{" "}
                          {form.watch("wholesale_price") || 0}
                          {form.watch("price") &&
                          form.watch("wholesale_price") ? (
                            <span className="ml-2">
                              (Save{" "}
                              {Math.round(
                                (((form.watch("price") ?? 0) -
                                  (form.watch("wholesale_price") ?? 0)) /
                                  (form.watch("price") ?? 1)) *
                                  100,
                              )}
                              %)
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Varieties Section */}
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Product Varieties
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="has_varieties"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            // Reset base fields when enabling varieties
                            if (checked) {
                              form.setValue("sku", "");
                              form.setValue("price", 0);
                              form.setValue("stock", 0);
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          This product has multiple varieties
                        </FormLabel>
                        <FormDescription>
                          Enable if this product comes in different wattages,
                          colors, or configurations
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <VarietiesManager disabled={isSubmitting} />
              </div>
            </CardContent>
          </Card>

          {/* Category & Features Card */}
          <Card>
            <CardContent>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Category & Features
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const category = lightingCategories.find(
                              (c) => c.id === value,
                            );
                            if (category?.subcategories?.[0]) {
                              form.setValue("tags", [
                                category.subcategories[0],
                              ]);
                            }
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {lightingCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-6 h-6 rounded bg-gradient-to-r ${category.color} flex items-center justify-center`}
                                  >
                                    {category.icon && (
                                      <category.icon className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                  <span>{category.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referral_points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral Points</FormLabel>
                        <Input placeholder="100" {...field} type="number" />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="installationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Installation Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select installation type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {installationOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="rounded border-gray-300 text-amber-600 focus:ring-2 focus:ring-amber-500"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Featured Product</FormLabel>
                          <FormDescription>Display on homepage</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dealOfTheDay"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="rounded border-gray-300 text-red-600 focus:ring-2 focus:ring-red-500"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Deal of the Day</FormLabel>
                          <FormDescription>Special daily offer</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bestSeller"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Best Seller</FormLabel>
                          <FormDescription>Mark as top seller</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Tags</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="e.g., waterproof, motion-sensor, solar-powered"
                          maxTags={10}
                          suggestions={lightingTags.map((tag) => tag.id)}
                        />
                      </FormControl>
                      <FormDescription>
                        Add relevant tags for filtering and search
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications Card */}
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Technical Specifications
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categorySpecs.showWattage && (
                    <FormField
                      control={form.control}
                      name="wattage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wattage</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground">
                                <Zap size={16} />
                              </span>
                              <Input
                                className="pl-10"
                                placeholder="20"
                                {...field}
                                type="number"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Power consumption</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {categorySpecs.showVoltage && (
                    <FormField
                      control={form.control}
                      name="voltage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voltage</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select voltage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {voltageOptions.map((voltage) => (
                                <SelectItem key={voltage} value={voltage}>
                                  {voltage}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {categorySpecs.showLumens && (
                    <FormField
                      control={form.control}
                      name="lumens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lumens (Brightness)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="2000"
                              {...field}
                              type="number"
                            />
                          </FormControl>
                          <FormDescription>Light output</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="colorTemperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Temperature</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select color temperature" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {colorTemperatureOptions.map((temp) => (
                              <SelectItem key={temp} value={temp}>
                                {temp}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warrantyMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty (Months)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">
                              <Shield size={16} />
                            </span>
                            <Input
                              className="pl-10"
                              placeholder="24"
                              {...field}
                              type="number"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {categorySpecs.showIPRating && (
                    <FormField
                      control={form.control}
                      name="ipRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IP Rating</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select IP rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ipRatingOptions.map((rating) => (
                                <SelectItem key={rating} value={rating}>
                                  {rating}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {categorySpecs.showBattery && (
                    <FormField
                      control={form.control}
                      name="batteryCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Battery Capacity</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground">
                                <Battery size={16} />
                              </span>
                              <Input
                                className="pl-10"
                                placeholder="e.g., 12V 20Ah"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {categorySpecs.showSolarPanel && (
                    <FormField
                      control={form.control}
                      name="solarPanelWattage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Solar Panel Wattage</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground">
                                <Sun size={16} />
                              </span>
                              <Input
                                className="pl-10"
                                placeholder="30"
                                {...field}
                                type="number"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="dimensions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensions (L×W×H)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">
                              <Ruler size={16} />
                            </span>
                            <Input
                              className="pl-10"
                              placeholder="e.g., 300×200×100mm"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Media
                </h3>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Images *</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value || []}
                            onChange={field.onChange}
                            disabled={isSubmitting}
                            maxFiles={8}
                          />
                        </FormControl>
                        <FormDescription>
                          Upload product images (first image will be the main
                          image)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2 w-full">
                          <FormLabel>Product Video</FormLabel>
                          <FormControl>
                            {/* Add strict width constraints */}
                            <div className="w-full max-w-full overflow-x-hidden">
                              <VideoUpload
                                value={field.value || ""}
                                onChange={field.onChange}
                                disabled={isSubmitting}
                              />
                            </div>
                          </FormControl>
                        </div>
                        <FormDescription>
                          Upload a product demonstration video (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card>
            <CardContent>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your lighting product in detail. Include features, benefits, specifications, and installation instructions..."
                        className="min-h-48 resize-y text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed product description for customers. Include key
                      features and benefits.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/products")}
              disabled={isSubmitting}
              className="min-w-24"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-24 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600"
            >
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
    </div>
  );
}
