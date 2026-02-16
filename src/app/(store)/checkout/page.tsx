// @ts-nocheck

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ChevronLeft,
  CreditCard,
  Truck,
  AlertCircle,
  Info,
  Smartphone,
  Zap,
  ShieldCheck,
  Clock,
  Package,
  Phone,
  MapPin,
  Gift,
  Sparkles,
  Battery,
  Loader2,
  CheckCircle,
  Crown,
  X,
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
import { Label } from "@/components/ui/label";
import { useCart, useStore } from "@/lib/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cities, installationOptions, shippingMethods } from "@/lib/constants";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { formSchema } from "@/types/store";
import { formatDate } from "date-fns";

export default function CheckoutPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const { dispatch } = useStore();
  const { cartItems } = useCart();
  const { profile } = useAuth();
  const [shippingCost, setShippingCost] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<any>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<any>(null);
  const newDate = formatDate(new Date(), "yyyy/MM/dd");
  const [installationDate, setInstallationDate] = useState(newDate);
  const [installationTime, setInstallationTime] = useState("evening");
  const [loyaltyRedemption, setLoyaltyRedemption] = useState<any>(null);
  const [applyingLoyalty, setApplyingLoyalty] = useState(false);
  const [loyaltyError, setLoyaltyError] = useState("");

  // If cart is empty, redirect to products
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push("/products");
    }
  }, [cartItems]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: profile?.full_name || "",
      lastName: "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
      city: profile?.city || "Nairobi",
      county: profile?.city || "Nairobi County",
      postalCode: profile?.postal_code || "",
      country: profile?.country || "Kenya",
      shippingMethod: "standard",
      paymentMethod: "mpesa",
      couponCode: "",
      installationRequired: false,
      specialInstructions: "",
    },
    mode: "onBlur",
  });

  // Watch form values
  const country = form.watch("country");
  const city = form.watch("city");
  const selectedShippingMethod = form.watch("shippingMethod");
  const installationRequired = form.watch("installationRequired");

  const {
    formState: { errors },
  } = form;

  // Load loyalty redemption from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("loyalty_redemption");
    if (stored) {
      const redemption = JSON.parse(stored);
      if (new Date(redemption.validUntil) > new Date()) {
        setLoyaltyRedemption(redemption);
      } else {
        localStorage.removeItem("loyalty_redemption");
      }
    }
  }, []);

  // Apply loyalty redemption
  const applyLoyaltyRedemption = async () => {
    if (!loyaltyRedemption) return;

    setApplyingLoyalty(true);
    setLoyaltyError("");

    try {
      // Store redemption code in form for backend processing
      form.setValue("loyaltyRedemptionCode", loyaltyRedemption.code);

      toast.success(
        `Loyalty discount of KES ${loyaltyRedemption.discount.toFixed(2)} will be applied at payment`,
      );
    } catch (error: any) {
      setLoyaltyError(error.message);
      toast.error("Failed to apply loyalty discount");
    } finally {
      setApplyingLoyalty(false);
    }
  };

  // Remove loyalty redemption
  const removeLoyaltyRedemption = () => {
    localStorage.removeItem("loyalty_redemption");
    setLoyaltyRedemption(null);
    form.setValue("loyaltyRedemptionCode", "");
    toast.info("Loyalty discount removed");
  };

  useEffect(() => {
    const errorEntries = Object.entries(errors);

    if (errorEntries.length > 0) {
      const firstError = errorEntries[0][1];

      toast.error("Fix shiping form errors", {
        description: firstError?.message ?? "Some fields are invalid",
        id: "form-error-toast", // prevents spam
      });
    }
  }, [errors]);

  // Calculate shipping
  useEffect(() => {
    if (country && city && selectedShippingMethod) {
      const method = shippingMethods.find(
        (m) => m.id === selectedShippingMethod,
      );
      let calculatedCost = method?.cost || 0;

      // Adjust cost based on location
      if (country === "Kenya") {
        if (city === "Nairobi") {
          calculatedCost = method?.cost || 200;
        } else if (["Mombasa", "Kisumu", "Nakuru"].includes(city)) {
          calculatedCost = (method?.cost || 200) + 100;
        } else {
          calculatedCost = (method?.cost || 200) + 200;
        }
      }

      setShippingCost(calculatedCost);
    }
  }, [country, city, selectedShippingMethod]);

  // Calculate subtotal with wholesale pricing
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const unitPrice =
        item.product.has_wholesale &&
        item.quantity >= (item.product.wholesale_min_quantity || 10)
          ? item.product.wholesale_price || item.product.price
          : item.product.price;
      return sum + unitPrice * item.quantity;
    }, 0);
  };

  // Calculate wholesale savings
  const calculateWholesaleSavings = () => {
    return cartItems.reduce((savings, item) => {
      if (
        item.product.has_wholesale &&
        item.quantity >= (item.product.wholesale_min_quantity || 10)
      ) {
        const wholesalePrice =
          item.product.wholesale_price || item.product.price;
        return savings + (item.product.price - wholesalePrice) * item.quantity;
      }
      return savings;
    }, 0);
  };

  // Calculate order totals
  const subtotal = calculateSubtotal();
  const wholesaleSavings = calculateWholesaleSavings();
  const installationCost = selectedInstallation?.cost || 0;
  const orderTotal = Math.max(
    0,
    subtotal +
      shippingCost +
      installationCost -
      couponDiscount -
      (loyaltyRedemption?.discount || 0),
  );

  // Validate coupon via API
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError("");

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponCode: couponCode.toUpperCase(),
          orderAmount: subtotal,
          customerEmail: form.getValues("email") || profile?.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to validate coupon");
      }

      if (!data.valid) {
        setCouponError(data.message);
        return;
      }

      // Coupon is valid
      setCouponApplied(true);
      setCouponDiscount(data.coupon.discount_amount);
      setCouponData(data.coupon);
      form.setValue("couponCode", couponCode.toUpperCase());

      toast.success("Coupon applied successfully!");
    } catch (error: any) {
      setCouponError(error.message || "Invalid coupon code");
      toast.error(error.message || "Failed to apply coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Remove coupon
  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponData(null);
    form.setValue("couponCode", "");
    setCouponError("");
    toast.info("Coupon removed");
  };

  // Get recommended installations based on cart items
  const getRecommendedInstallations = () => {
    const recommendations = [];
    const productTypes = new Set();

    // Analyze cart items
    cartItems.forEach((item) => {
      const category = item.product.category?.toLowerCase() || "";
      const tags = Array.isArray(item.product.tags)
        ? item.product.tags.map((t) => t.toLowerCase())
        : [];

      if (
        category.includes("solar") ||
        tags.some((tag) => tag.includes("solar"))
      ) {
        productTypes.add("solar");
      }
      if (
        category.includes("security") ||
        tags.some((tag) => tag.includes("security"))
      ) {
        productTypes.add("security");
      }
      if (
        category.includes("commercial") ||
        category.includes("industrial") ||
        tags.some(
          (tag) => tag.includes("commercial") || tag.includes("industrial"),
        )
      ) {
        productTypes.add("commercial");
      }
      if (
        category.includes("emergency") ||
        tags.some((tag) => tag.includes("emergency"))
      ) {
        productTypes.add("emergency");
      }
    });

    // Add recommendations
    if (productTypes.has("solar")) {
      recommendations.push(
        installationOptions.find((s) => s.id === "solar-light"),
      );
    }
    if (productTypes.has("security")) {
      recommendations.push(
        installationOptions.find((s) => s.id === "security-light"),
      );
    }
    if (productTypes.has("commercial")) {
      recommendations.push(
        installationOptions.find((s) => s.id === "commercial-lighting"),
      );
    }

    // Always include basic option
    if (recommendations.length === 0 || cartItems.length <= 3) {
      recommendations.push(
        installationOptions.find((s) => s.id === "basic-bulb"),
      );
    }

    return recommendations.filter(Boolean).slice(0, 4);
  };

  // Installation Service Card Component
  const InstallationServiceCard = ({ service, selected, onSelect }) => (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
      } ${service.recommended ? "relative" : ""}`}
      onClick={onSelect}
    >
      {service.recommended && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
            Recommended
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{service.icon}</span>
            <h4 className="font-bold">{service.name}</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {service.description}
          </p>
        </div>
        <div className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0">
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-500" />
            {service.duration}
          </span>
          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
            {formatCurrency(service.cost, "KES")}
          </span>
        </div>

        {service.bestFor && (
          <div className="flex flex-wrap gap-1 mt-2">
            {service.bestFor.slice(0, 2).map((item: any, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
            {service.bestFor.length > 2 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{service.bestFor.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>

      {service.includes && (
        <div className="mt-3 pt-3 border-t dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Includes:
          </p>
          <div className="space-y-1">
            {service.includes.slice(0, 2).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
            {service.includes.length > 2 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                + {service.includes.length - 2} more services
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      // Get referral data from localStorage for items in cart
      const itemsWithReferral = cartItems.map((item) => {
        // Check for referral for this specific product
        const referralKey = `referral_${item.product.id}_*`;
        const keys = Object.keys(localStorage);

        // Find any referral for this product
        const productReferralKey = keys.find((key) =>
          key.startsWith(`referral_${item.product.id}_`),
        );

        if (productReferralKey) {
          const referralData = JSON.parse(
            localStorage.getItem(productReferralKey) || "{}",
          );

          // Check if referral is valid and not self-referral
          if (
            referralData.referrerId &&
            referralData.referrerId !== profile?.id &&
            new Date(referralData.expiresAt) > new Date()
          ) {
            return {
              ...item,
              referral: referralData,
            };
          }
        }

        return {
          ...item,
          referral: null,
        };
      });

      // Find the most recent valid referral
      let latestReferral = null;
      let latestTimestamp = 0;

      itemsWithReferral.forEach((item) => {
        if (
          item.referral &&
          new Date(item.referral.timestamp).getTime() > latestTimestamp
        ) {
          latestTimestamp = new Date(item.referral.timestamp).getTime();
          latestReferral = item.referral;
        }
      });

      // Build comprehensive order data
      const orderData = {
        // Basic order info
        items: cartItems.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          title: item.product.title,
          sku: item.product.sku,
          price: item.product.price,
          wholesale_price: item.product.wholesale_price,
          wholesale_min_quantity: item.product.wholesale_min_quantity,
          has_wholesale: item.product.has_wholesale,
          quantity: item.quantity,
          image: item.product.images?.[0],
          category: item.product.category,
          applied_price:
            item.product.has_wholesale &&
            item.quantity >= (item.product.wholesale_min_quantity || 10)
              ? item.product.wholesale_price || item.product.price
              : item.product.price,
          variant: item.variant,
        })),

        // Customer information
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },

        // Shipping information
        shipping: {
          address: values.address,
          city: values.city,
          county: values.county,
          postalCode: values.postalCode,
          country: values.country,
          method: values.shippingMethod,
          cost: shippingCost,
          estimatedDelivery: shippingMethods.find(
            (m) => m.id === values.shippingMethod,
          )?.time,
        },

        // Payment information
        payment: {
          method: values.paymentMethod,
        },

        // Additional services
        services: {
          installation: installationRequired
            ? {
                required: true,
                service: selectedInstallation,
                cost: installationCost,
                date: installationDate,
                time: installationTime,
                instructions: values.specialInstructions,
              }
            : {
                required: false,
              },
        },

        // Coupon information
        coupon: couponApplied
          ? {
              code: values.couponCode,
              discount: couponDiscount,
              data: couponData,
            }
          : null,

        // Redeemed code
        loyaltyCode: values.loyaltyRedemptionCode,

        // Financial breakdown
        totals: {
          subtotal: subtotal,
          wholesaleSavings: wholesaleSavings,
          shipping: shippingCost,
          installation: installationCost,
          couponDiscount: couponDiscount,
          total: orderTotal,
        },

        // Metadata
        metadata: {
          createdAt: new Date().toISOString(),
          cartCount: cartItems.length,
          wholesaleApplied: wholesaleSavings > 0,
          // Add only one referral (the most recent valid one)
          ...(latestReferral && {
            referral: {
              referrerId: latestReferral.referrerId,
              productId: latestReferral.productId,
              source: "product_share",
              timestamp: latestReferral.timestamp,
            },
          }),
        },
      };

      // Store in context
      dispatch({ type: "SET_PENDING_ORDER", payload: orderData });
      dispatch({ type: "SET_TOTAL", payload: orderTotal });

      // Redirect to payment page
      router.push("/checkout/payment");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to process checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Checkout Progress */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
              <div>
                <Link
                  href="/cart"
                  className="flex items-center text-amber-700 hover:text-amber-800 font-medium"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Cart
                </Link>
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
                  Complete Your Lighting Order
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Fill in your details to illuminate your space with quality
                  lighting
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Secure Checkout
              </Badge>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2 overflow-auto">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center">
                    1
                  </div>
                  <span className="font-medium">Details</span>
                </div>
                <div className="h-px flex-1 bg-gray-300 mx-4" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center">
                    2
                  </div>
                  <span className="font-medium text-gray-500">Payment</span>
                </div>
                <div className="h-px flex-1 bg-gray-300 mx-4" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center">
                    3
                  </div>
                  <span className="font-medium text-gray-500">
                    Confirmation
                  </span>
                </div>
              </div>
              <Progress value={33} className="h-2" />
            </div>
          </div>

          {/* Quick Help Banner */}
          <Alert className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-medium">
                Need expert advice on your lighting setup?
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <a
                    href="tel:+254727833691"
                    className="font-bold hover:text-amber-700"
                  >
                    0727 833 691
                  </a>
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  8AM - 6PM Daily
                </span>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="shipping" className="w-full">
                <TabsList className="grid grid-cols-3 mb-6 bg-amber-50 dark:bg-amber-950/20">
                  <TabsTrigger
                    value="shipping"
                    className="data-[state=active]:bg-amber-500"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Shipping
                  </TabsTrigger>
                  <TabsTrigger
                    value="installation"
                    className="data-[state=active]:bg-amber-500"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Installation
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment"
                    className="data-[state=active]:bg-amber-500"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payment
                  </TabsTrigger>
                </TabsList>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Shipping Tab */}
                    <TabsContent value="shipping" className="space-y-6">
                      <Card>
                        <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
                          <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-amber-600" />
                            Delivery Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="space-y-6">
                            {/* Personal Information */}
                            <div>
                              <h3 className="text-lg font-semibold mb-4">
                                Personal Information
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="firstName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>First Name *</FormLabel>
                                      <FormControl>
                                        <Input placeholder="John" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="lastName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Last Name *</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Kamau" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <FormField
                                  control={form.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email *</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="email"
                                          placeholder="john@example.com"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="phone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Phone *</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="tel"
                                          placeholder="+254 7XX XXX XXX"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <Separator />

                            {/* Shipping Address */}
                            <div>
                              <h3 className="text-lg font-semibold mb-4">
                                Shipping Address
                              </h3>
                              <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                  <FormItem className="mb-4">
                                    <FormLabel>Street Address *</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., Duruma Road, Industrial Area"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="city"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>City/Town *</FormLabel>
                                      <FormControl>
                                        <Select
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select city" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {cities.map((county) => (
                                              <SelectItem
                                                key={county}
                                                value={county}
                                              >
                                                {county}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="county"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>County *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="e.g., Nairobi County"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="postalCode"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Postal Code</FormLabel>
                                      <FormControl>
                                        <Input placeholder="00100" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="mt-4">
                                <FormField
                                  control={form.control}
                                  name="country"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Country</FormLabel>
                                      <FormControl>
                                        <Input
                                          readOnly
                                          value="Kenya"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <Separator />

                            {/* Shipping Method */}
                            <div>
                              <h3 className="text-lg font-semibold mb-4">
                                Delivery Method
                              </h3>
                              <FormField
                                control={form.control}
                                name="shippingMethod"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="space-y-3"
                                      >
                                        {shippingMethods.map((method) => {
                                          const Icon = method.icon;
                                          return (
                                            <div
                                              key={method.id}
                                              className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-amber-50/50 cursor-pointer transition-all"
                                            >
                                              <RadioGroupItem
                                                value={method.id}
                                                id={method.id}
                                              />
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                  <Icon className="h-4 w-4 text-amber-600" />
                                                  <Label
                                                    htmlFor={method.id}
                                                    className="font-medium cursor-pointer"
                                                  >
                                                    {method.name}
                                                  </Label>
                                                  {method.id === "express" && (
                                                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500">
                                                      Popular
                                                    </Badge>
                                                  )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                  {method.description}
                                                </p>
                                                <p className="text-sm text-amber-600 font-medium mt-1">
                                                  <Clock className="h-3 w-3 inline mr-1" />
                                                  {method.time}
                                                </p>
                                              </div>
                                              <div className="font-bold text-lg">
                                                {method.cost === 0 ? (
                                                  <span className="text-green-600">
                                                    FREE
                                                  </span>
                                                ) : (
                                                  `KES ${method.cost}`
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Installation Tab */}
                    <TabsContent value="installation" className="space-y-6">
                      <Card>
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-blue-600" />
                            Professional Installation Services (Optional)
                          </CardTitle>
                          <p className="text-sm text-gray-600 font-normal mt-2">
                            Our certified electricians provide safe and reliable
                            installation.
                            <span className="text-amber-600 font-medium">
                              {" "}
                              Certified by EPRA Kenya
                            </span>
                          </p>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="space-y-6">
                            <FormField
                              control={form.control}
                              name="installationRequired"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-4">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="border-gray-300 text-blue-600 h-5 w-5"
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-semibold text-lg">
                                      Add Professional Installation
                                    </FormLabel>
                                    <FormDescription>
                                      Recommended for solar systems, commercial
                                      setups, and complex installations.
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            {installationRequired && (
                              <div className="space-y-6">
                                {/* Recommended Services */}
                                {getRecommendedInstallations().length > 0 && (
                                  <div>
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                      <Sparkles className="h-5 w-5 text-amber-500" />
                                      Recommended for Your Order
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {getRecommendedInstallations().map(
                                        (service: any) => (
                                          <InstallationServiceCard
                                            key={service.id}
                                            service={service}
                                            selected={
                                              selectedInstallation?.id ===
                                              service.id
                                            }
                                            onSelect={() =>
                                              setSelectedInstallation(service)
                                            }
                                          />
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* All Installation Options */}
                                <div>
                                  <h3 className="font-semibold text-lg mb-4">
                                    All Installation Services
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {installationOptions.map((service) => (
                                      <InstallationServiceCard
                                        key={service.id}
                                        service={service}
                                        selected={
                                          selectedInstallation?.id ===
                                          service.id
                                        }
                                        onSelect={() =>
                                          setSelectedInstallation(service)
                                        }
                                      />
                                    ))}
                                  </div>
                                </div>

                                {/* Installation Details */}
                                {selectedInstallation && (
                                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                                    <h4 className="font-semibold flex items-center gap-2">
                                      <Info className="h-4 w-4" />
                                      Installation Details
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <Label>
                                          Preferred Installation Date
                                        </Label>
                                        <Input
                                          type="date"
                                          min={
                                            new Date()
                                              .toISOString()
                                              .split("T")[0]
                                          }
                                          value={installationDate}
                                          onChange={(e) =>
                                            setInstallationDate(e.target.value)
                                          }
                                        />
                                      </div>
                                      <div>
                                        <Label>Preferred Time Slot</Label>
                                        <Select
                                          value={installationTime}
                                          onValueChange={setInstallationTime}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select time" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="morning">
                                              Morning (9AM - 12PM)
                                            </SelectItem>
                                            <SelectItem value="afternoon">
                                              Afternoon (1PM - 4PM)
                                            </SelectItem>
                                            <SelectItem value="evening">
                                              Evening (5PM - 7PM)
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <FormField
                                      control={form.control}
                                      name="specialInstructions"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>
                                            Special Instructions
                                          </FormLabel>
                                          <FormControl>
                                            <Textarea
                                              placeholder="e.g., Need ladder access, specific wall colors, existing wiring notes..."
                                              className="min-h-24"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <Alert className="border-green-200 bg-green-50">
                                      <ShieldCheck className="h-4 w-4 text-green-600" />
                                      <AlertDescription className="text-sm">
                                        <span className="font-medium">
                                          6-month Installation Warranty:
                                        </span>{" "}
                                        All installations are covered by our
                                        workmanship warranty.
                                      </AlertDescription>
                                    </Alert>
                                  </div>
                                )}
                              </div>
                            )}

                            {!installationRequired && (
                              <div className="p-4 border rounded-lg">
                                <div className="flex items-start gap-3">
                                  <Info className="h-5 w-5 text-gray-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium">
                                      DIY Installation
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Most products include installation guides.
                                      Professional installation is recommended
                                      for solar systems.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Payment Method Tab */}
                    <TabsContent value="payment" className="space-y-6">
                      <Card>
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                          <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-purple-600" />
                            Payment Method
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="space-y-6">
                            {/* Loyalty Points Section */}
                            {profile && (
                              <div className="space-y-4">
                                {/* Active Loyalty Redemption */}
                                {loyaltyRedemption ? (
                                  <div className="animate-fade-in bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 flex items-center justify-center">
                                            <Crown className="h-5 w-5 text-green-600 dark:text-green-400" />
                                          </div>
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                                              Loyalty Discount Applied
                                            </Badge>
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              Expires:{" "}
                                              {new Date(
                                                loyaltyRedemption.validUntil,
                                              ).toLocaleDateString()}
                                            </Badge>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="font-semibold text-lg text-green-700 dark:text-green-300">
                                              -KES{" "}
                                              {loyaltyRedemption.discount.toFixed(
                                                2,
                                              )}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                              <div className="flex items-center gap-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                <span>
                                                  {loyaltyRedemption.points}{" "}
                                                  points redeemed
                                                </span>
                                              </div>
                                              <span>•</span>
                                              <div className="flex items-center gap-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>
                                                  Code:{" "}
                                                  <code className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
                                                    {loyaltyRedemption.code}
                                                  </code>
                                                </span>
                                              </div>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                              This discount will be
                                              automatically applied to your
                                              order total
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={removeLoyaltyRedemption}
                                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  /* No Active Redemption - Show Available Points */
                                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 flex items-center justify-center">
                                            <Gift className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                          </div>
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Badge
                                              variant="outline"
                                              className="bg-white/50 dark:bg-gray-900/50"
                                            >
                                              Available Points
                                            </Badge>
                                            {applyingLoyalty && (
                                              <Badge className="bg-blue-500">
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                Applying...
                                              </Badge>
                                            )}
                                          </div>

                                          <div className="space-y-2">
                                            {/* Points Summary */}
                                            <div className="flex flex-wrap items-center gap-4">
                                              <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                  Your Balance
                                                </p>
                                                <div className="flex items-baseline gap-1">
                                                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                                                    {loyaltyRedemption?.points?.toLocaleString() ||
                                                      0}
                                                  </span>
                                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    points
                                                  </span>
                                                </div>
                                              </div>

                                              <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />

                                              <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                  Available to Redeem
                                                </p>
                                                <div className="flex items-baseline gap-1">
                                                  <span className="text-xl font-bold text-green-700 dark:text-green-300">
                                                    KES{" "}
                                                    {(
                                                      (Math.floor(
                                                        (loyaltyRedemption?.points ||
                                                          0) / 100,
                                                      ) *
                                                        100) /
                                                      10
                                                    ).toFixed(2)}
                                                  </span>
                                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    (
                                                    {Math.floor(
                                                      (loyaltyRedemption?.points ||
                                                        0) / 100,
                                                    ) * 100}{" "}
                                                    points)
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Error Message */}
                                            {loyaltyError && (
                                              <Alert
                                                variant="destructive"
                                                className="py-2"
                                              >
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="text-sm">
                                                  {loyaltyError}
                                                </AlertDescription>
                                              </Alert>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap gap-2 pt-2">
                                              {loyaltyRedemption?.points >=
                                              100 ? (
                                                <>
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white shadow-sm"
                                                    onClick={() =>
                                                      applyLoyaltyRedemption()
                                                    }
                                                    disabled={applyingLoyalty}
                                                  >
                                                    {applyingLoyalty ? (
                                                      <>
                                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                        Applying...
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Sparkles className="h-3 w-3 mr-2" />
                                                        Apply Points
                                                      </>
                                                    )}
                                                  </Button>
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      router.push(
                                                        "/account/loyalty",
                                                      )
                                                    }
                                                    className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                                                  >
                                                    <Gift className="h-3 w-3 mr-2" />
                                                    Manage Points
                                                  </Button>
                                                </>
                                              ) : (
                                                <div className="flex items-center gap-2">
                                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    Need at least 100 points to
                                                    redeem. Earn more points
                                                    with purchases!
                                                  </span>
                                                </div>
                                              )}
                                            </div>

                                            {/* Quick Info */}
                                            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-500 pt-2">
                                              <div className="flex items-center gap-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>100 points = KES 10</span>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                <span>Never expires</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Divider */}
                            <Separator className="my-4" />
                            {/* Coupon Section */}
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Gift className="h-5 w-5 text-amber-600" />
                                  <h4 className="font-semibold">
                                    Have a coupon code?
                                  </h4>
                                </div>
                                {!showCouponInput && !couponApplied && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCouponInput(true)}
                                  >
                                    Apply Coupon
                                  </Button>
                                )}
                              </div>

                              {(showCouponInput || couponApplied) && (
                                <div className="space-y-3">
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Enter coupon code"
                                      value={couponCode}
                                      onChange={(e) =>
                                        setCouponCode(e.target.value)
                                      }
                                      disabled={couponApplied}
                                      className="flex-1"
                                    />
                                    {couponApplied ? (
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={removeCoupon}
                                      >
                                        Remove
                                      </Button>
                                    ) : (
                                      <Button
                                        type="button"
                                        onClick={validateCoupon}
                                        disabled={isValidatingCoupon}
                                      >
                                        {isValidatingCoupon ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Validating...
                                          </>
                                        ) : (
                                          "Apply"
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                  {couponError && (
                                    <p className="text-sm text-red-600">
                                      {couponError}
                                    </p>
                                  )}
                                  {couponApplied && (
                                    <div className="flex items-center gap-2 text-green-600 text-xs">
                                      <CheckCircle className="h-4 w-4" />
                                      <span>
                                        Coupon applied! You saved{" "}
                                        {formatCurrency(couponDiscount, "KES")}
                                      </span>
                                      {couponData?.max_discount && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          Max discount:{" "}
                                          {formatCurrency(
                                            couponData.max_discount,
                                            "KES",
                                          )}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <Separator />

                            {/* Payment Methods */}
                            <div>
                              <h4 className="font-semibold mb-4">
                                Choose Payment Method
                              </h4>
                              <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="space-y-3"
                                      >
                                        {/* M-Pesa */}
                                        <div className="border rounded-lg p-4 hover:bg-purple-50/50 cursor-pointer">
                                          <div className="flex items-center space-x-3">
                                            <RadioGroupItem
                                              value="mpesa"
                                              id="mpesa"
                                            />
                                            <div className="flex-1">
                                              <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                  <Smartphone className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div>
                                                  <Label
                                                    htmlFor="mpesa"
                                                    className="font-medium cursor-pointer text-lg"
                                                  >
                                                    M-Pesa
                                                  </Label>
                                                  <p className="text-sm text-gray-600">
                                                    Pay instantly via mobile
                                                    money
                                                  </p>
                                                </div>
                                                <div className="mt-3 pl-12 hidden sm:flex sm:flex-col">
                                                  <div className="flex items-center gap-2 text-sm">
                                                    <ShieldCheck className="h-3 w-3 text-green-500" />
                                                    <span>
                                                      Instant confirmation
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-2 text-sm mt-1">
                                                    <Zap className="h-3 w-3 text-green-500" />
                                                    <span>
                                                      Receive STK push on your
                                                      phone
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* PayPal */}
                                        <div className="border rounded-lg p-4 hover:bg-purple-50/50 cursor-pointer">
                                          <div className="flex items-center space-x-3">
                                            <RadioGroupItem
                                              value="paypal"
                                              id="paypal"
                                            />
                                            <div className="flex-1">
                                              <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                  <CreditCard className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                  <Label
                                                    htmlFor="paypal"
                                                    className="font-medium cursor-pointer text-lg"
                                                  >
                                                    PayPal / Credit Card
                                                  </Label>
                                                  <p className="text-sm text-gray-600">
                                                    International cards accepted
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 text-lg bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Continue to Payment
                          <ChevronLeft className="ml-2 h-4 w-4 rotate-180" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </Tabs>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="sticky top-6 border-amber-200">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-600" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Order Items */}
                  <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
                    {cartItems.map((item) => {
                      const unitPrice =
                        item.product.has_wholesale &&
                        item.quantity >=
                          (item.product.wholesale_min_quantity || 10)
                          ? item.product.wholesale_price || item.product.price
                          : item.product.price;
                      const isWholesale =
                        item.product.has_wholesale &&
                        item.quantity >=
                          (item.product.wholesale_min_quantity || 10);

                      return (
                        <div key={item.product.id} className="space-y-2">
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {item.product.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  Qty: {item.quantity}
                                </Badge>
                                {isWholesale && (
                                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                                    Wholesale
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatCurrency(
                                  unitPrice * item.quantity,
                                  "KES",
                                )}
                              </p>
                              {isWholesale &&
                                item.product.price !== unitPrice && (
                                  <p className="text-xs text-green-600">
                                    Save{" "}
                                    {formatCurrency(
                                      (item.product.price - unitPrice) *
                                        item.quantity,
                                      "KES",
                                    )}
                                  </p>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  {/* Cost Breakdown */}
                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium">
                        {formatCurrency(subtotal, "KES")}
                      </span>
                    </div>

                    {wholesaleSavings > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Wholesale Savings</span>
                        <span className="font-medium">
                          -{formatCurrency(wholesaleSavings, "KES")}
                        </span>
                      </div>
                    )}

                    {couponApplied && (
                      <div className="flex justify-between text-purple-600">
                        <span>Coupon Discount</span>
                        <span className="font-medium">
                          -{formatCurrency(couponDiscount, "KES")}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <div>
                        <span>Shipping</span>
                        <p className="text-xs text-gray-500">
                          {selectedShippingMethod === "pickup"
                            ? "Store pickup"
                            : `to ${city || "Nairobi"}`}
                        </p>
                      </div>
                      <span className="font-medium">
                        {shippingCost === 0
                          ? "FREE"
                          : formatCurrency(shippingCost, "KES")}
                      </span>
                    </div>

                    {installationRequired && selectedInstallation && (
                      <div className="flex justify-between">
                        <div>
                          <span>Installation</span>
                          <p className="text-xs text-gray-500">
                            {selectedInstallation.name}
                          </p>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(installationCost, "KES")}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-xl font-bold pt-2">
                      <span>Total</span>
                      <span className="text-amber-600">
                        {formatCurrency(orderTotal, "KES")}
                      </span>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="space-y-1">
                        <ShieldCheck className="h-5 w-5 text-green-500 mx-auto" />
                        <p className="text-xs font-medium">Secure Payment</p>
                      </div>
                      <div className="space-y-1">
                        <Truck className="h-5 w-5 text-blue-500 mx-auto" />
                        <p className="text-xs font-medium">Fast Delivery</p>
                      </div>
                      <div className="space-y-1">
                        <Zap className="h-5 w-5 text-amber-500 mx-auto" />
                        <p className="text-xs font-medium">24/7 Support</p>
                      </div>
                      <div className="space-y-1">
                        <Battery className="h-5 w-5 text-purple-500 mx-auto" />
                        <p className="text-xs font-medium">Warranty</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
