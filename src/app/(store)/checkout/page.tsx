"use client";

import { use, useEffect, useState } from "react";
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
  Globe,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { buildOrderData, useCart, useStore } from "@/lib/context/StoreContext";
import {
  calculateOrderTotals,
  calculateShipping,
  formatCurrency,
} from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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

// Form schema
const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  address: z.string().min(5, "Address must be at least 5 characters."),
  city: z.string().min(2, "City must be at least 2 characters."),
  state: z.string().min(2, "State must be at least 2 characters."),
  postalCode: z.string().min(5, "Postal code must be at least 5 characters."),
  country: z.string().min(2, "Country must be at least 2 characters."),
  shippingMethod: z.enum(["standard", "express", "pickup"], {
    message: "Please select a shipping method.",
  }),
  paymentMethod: z.enum(["paypal", "mpesa"], {
    message: "Please select a payment method.",
  }),
});

// Country and city options for Kenya
const kenyanCounties = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Malindi",
  "Kitale",
  "Garissa",
  "Kakamega",
  "Nyeri",
  "Meru",
];

const shippingMethods = [
  {
    id: "standard",
    name: "Standard Delivery",
    cost: 200,
    time: "3-5 business days",
    description: "via local courier",
  },
  {
    id: "express",
    name: "Express Delivery",
    cost: 500,
    time: "1-2 business days",
    description: "via express service",
  },
  {
    id: "pickup",
    name: "Store Pickup",
    cost: 0,
    time: "Ready for pickup",
    description: "Collect from our location",
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state, dispatch } = useStore();
  const { cartItems } = useCart();
  const [shippingCost, setShippingCost] = useState(0);

  // If cart is empty, redirect to products
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push("/products");
    }
  }, [cartItems, router]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Kenya",
      shippingMethod: "standard",
      paymentMethod: "mpesa",
    },
    mode: "onBlur",
  });

  // Watch form values for shipping calculation
  const country = form.watch("country");
  const city = form.watch("city");
  const selectedShippingMethod = form.watch("shippingMethod");

  // Calculate shipping based on location and method
  useEffect(() => {
    if (country && city && selectedShippingMethod) {
      const method = shippingMethods.find(
        (m) => m.id === selectedShippingMethod
      );
      let calculatedCost = method?.cost || 0;

      // Adjust cost based on location (Kenyan context)
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

  // Calculate order totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const orderTotal = subtotal + shippingCost;
  const totalWeight = cartItems.reduce(
    (sum, item) => sum + (item.product.weight || 0.5) * item.quantity,
    0
  );

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      // Build order data with shipping cost
      const orderData = {
        ...buildOrderData(state, values),
        shippingCost,
        shippingMethod: values.shippingMethod,
        totalAmount: orderTotal,
      };

      // Store in context so payment page can access
      dispatch({ type: "SET_PENDING_ORDER", payload: orderData });
      dispatch({ type: "SET_TOTAL", payload: orderTotal });

      // Redirect to payment page
      router.push("/checkout/payment");
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-2 sm:px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/cart"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Cart
        </Link>

        <div className="mb-6">
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 mb-3"
          >
            <Truck className="w-3 h-3 mr-1" />
            Checkout Demo
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Complete Your Order
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Fill in your details to see shipping calculations in action. The
            next step is a <strong>test payment interface</strong> - charges
            will be made if you complete the transaction.
          </p>
        </div>
      </div>

      {/* Payment Notice */}
      <Card className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg mb-2">
                Important: Test Payment Experience
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                After filling this form, you'll proceed to a{" "}
                <strong>test payment interface</strong>. You can:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground mb-4">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <span>
                    <strong>Test M-Pesa STK Push</strong>: You'll see a
                    simulated M-Pesa prompt (Actual payment)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <span>
                    <strong>Test PayPal flow</strong>: Experience the PayPal
                    checkout process in live mode
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <span>
                    <strong>Complete or cancel</strong>: You can proceed to see
                    order confirmation or cancel at any point
                  </span>
                </li>
              </ul>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                💡 This demo shows how real customers will experience checkout
                in your custom store.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Shipping Information
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Fill in your details to calculate shipping costs
              </p>
            </div>

            <div className="p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Contact Information */}
                  <div>
                    <h3 className="font-medium mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
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
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Kamau" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
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
                            <FormLabel>Phone Number</FormLabel>
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
                    <h3 className="font-medium mb-4">Shipping Address</h3>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Main Street, Westlands"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City/Town</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select city" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Nairobi">
                                    Nairobi
                                  </SelectItem>
                                  <SelectItem value="Mombasa">
                                    Mombasa
                                  </SelectItem>
                                  <SelectItem value="Kisumu">Kisumu</SelectItem>
                                  <SelectItem value="Nakuru">Nakuru</SelectItem>
                                  <SelectItem value="Eldoret">
                                    Eldoret
                                  </SelectItem>
                                  <SelectItem value="Thika">Thika</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>County</FormLabel>
                            <FormControl>
                              <Input placeholder="Nairobi County" {...field} />
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
                                defaultValue={"Kenya"}
                                readOnly
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
                    <h3 className="font-medium mb-4">Shipping Method</h3>
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
                              {shippingMethods.map((method) => (
                                <div
                                  key={method.id}
                                  className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                                >
                                  <RadioGroupItem
                                    value={method.id}
                                    id={method.id}
                                  />
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={method.id}
                                      className="font-medium cursor-pointer"
                                    >
                                      {method.name}
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {method.time} • {method.description}
                                    </p>
                                  </div>
                                  <div className="font-bold">
                                    {method.cost === 0
                                      ? "FREE"
                                      : `KES ${method.cost}`}
                                  </div>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Method (Live Environment)
                    </h3>
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
                              <div className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                                <div className="flex items-center space-x-3">
                                  <RadioGroupItem value="mpesa" id="mpesa" />
                                  <div className="flex-1">
                                    <Label
                                      htmlFor="mpesa"
                                      className="font-medium cursor-pointer"
                                    >
                                      <span className="flex items-center gap-2">
                                        M-Pesa
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          Kenyan Mobile Money
                                        </Badge>
                                      </span>
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Test the M-Pesa STK Push flow (live)
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                                <div className="flex items-center space-x-3">
                                  <RadioGroupItem value="paypal" id="paypal" />
                                  <div className="flex-1">
                                    <Label
                                      htmlFor="paypal"
                                      className="font-medium cursor-pointer"
                                    >
                                      PayPal / Credit Card
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Test international payment processing
                                      (live mode)
                                    </p>
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

                  <Button
                    type="submit"
                    className="w-full h-12 text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Processing...</>
                    ) : (
                      <>Continue to Test Payment →</>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Order Summary</h2>
            </div>

            <div className="p-6">
              {/* Order Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {item.product.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Qty: {item.quantity}
                        </Badge>
                        {item.product.category && (
                          <Badge variant="secondary" className="text-xs">
                            {item.product.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(
                        item.product.price * item.quantity,
                        "KES"
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Cost Breakdown */}
              <div className="space-y-3 pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal, "KES")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <div>
                    <span className="text-muted-foreground">Shipping</span>
                    <p className="text-xs text-muted-foreground">
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

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(orderTotal, "KES")}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info Note */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <Info className="h-3 w-3 inline mr-1" />
                  Shipping cost updates in real-time based on location and
                  method selected.
                </p>
              </div>
            </div>
          </Card>

          {/* Next Steps Info */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3">What Happens Next?</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <span>
                    <strong>Test Payment Interface:</strong> You'll see a
                    payment screen
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <span>
                    <strong>Experience Payment Flow:</strong> Try M-Pesa STK
                    Push or PayPal live mode
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <span>
                    <strong>Order Confirmation:</strong> See the order tracking
                    page regardless of completion
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
