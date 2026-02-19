// components/auth/SignUpForm.tsx
// @ts-nocheck
"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Building,
  CheckCircle,
  Eye,
  EyeOff,
  Gift,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signUpSchema } from "@/types/customer";
import { businessTypes, cities } from "@/lib/constants";
import { Alert, AlertDescription } from "../ui/alert";

type SignUpData = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSuccess?: () => void;
  ref: string | undefined;
}

export default function SignUpForm({ onSuccess, ref }: SignUpFormProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isBusinessCustomer, setIsBusinessCustomer] = useState(false);
  const [pendingReferral, setPendingReferral] = useState("");

  const form = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      address: "",
      city: "",
      postalCode: "",
      businessName: "",
      businessType: "",
      receiveOffers: true,
      receiveNewsletter: true,
      termsAccepted: false,
      referralCode: pendingReferral || undefined,
    },
  });

  // Set a cookie with referral code if present in URL
  useState(() => {
    if (ref) {
      setPendingReferral(ref);
      document.cookie = `referral=${ref}; path=/; max-age=${60 * 60 * 24 * 30}`; // Expires in 30 days
    } else {
      // Check if referral cookie exists
      const existingReferral = getReferralFromCookie();
      if (existingReferral) {
        setPendingReferral(existingReferral);
      }
    }
  });

  // Get referral code from cookie (if exists)
  const getReferralFromCookie = () => {
    const match = document.cookie.match(new RegExp("(^| )referral=([^;]+)"));
    return match ? match[2] : null;
  };

  const onSubmit = async (data: SignUpData) => {
    setLoading(true);
    const toastId = toast.loading("Creating your account...");

    try {
      // Call the API endpoint to create account
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Signup failed");
      }

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Account created! Check your email to confirm</span>
        </div>,
        { id: toastId, duration: 8000 },
      );

      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      form.reset();
    } catch (err: any) {
      toast.error(err.message || "Signup failed", { id: toastId });
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Referral Alert */}
        {pendingReferral && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
              You were referred by a friend! Complete signup to get{" "}
              <span className="font-bold">100 bonus points</span> on your first
              purchase.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    className="bg-white dark:bg-gray-800"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                    className="bg-white dark:bg-gray-800"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="0727 833 691"
                    {...field}
                    className="bg-white dark:bg-gray-800"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  For order updates and delivery
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  City *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Delivery Address (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Duruma Road, House No. 123"
                  {...field}
                  className="bg-white dark:bg-gray-800"
                />
              </FormControl>
              <FormDescription className="text-xs">
                For faster checkout and delivery
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Business Customer Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="business-customer"
            checked={isBusinessCustomer}
            onCheckedChange={(checked) =>
              setIsBusinessCustomer(checked as boolean)
            }
          />
          <label
            htmlFor="business-customer"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I&apos;m signing up for business purposes
          </label>
        </div>

        {/* Business Fields - Conditionally Shown */}
        {isBusinessCustomer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-amber-200 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Business Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your Business Name"
                      {...field}
                      className="bg-white dark:bg-gray-800"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-gray-800">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password *
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      {...field}
                      className="bg-white dark:bg-gray-800 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirm Password *
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      {...field}
                      className="bg-white dark:bg-gray-800 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="receiveOffers"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="rounded border-gray-300 text-amber-600 focus:ring-2 focus:ring-amber-500"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Receive special offers and discounts</FormLabel>
                  <FormDescription className="text-xs">
                    Get exclusive deals, flash sales, and promotions
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="receiveNewsletter"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="rounded border-gray-300 text-amber-600 focus:ring-2 focus:ring-amber-500"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Subscribe to lighting tips newsletter</FormLabel>
                  <FormDescription className="text-xs">
                    Get expert tips, new product announcements, and
                    energy-saving guides
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="rounded border-gray-300 text-amber-600 focus:ring-2 focus:ring-amber-500"
                  />
                </FormControl>
                <div className="space-y-0 leading-none">
                  <FormLabel className="flex flex-wrap font-normal text-sm w-full">
                    I agree to the{" "}
                    <a href="/terms" className="text-amber-600 hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      className="text-amber-600 hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 text-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Creating Account...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Create My Account
            </>
          )}
        </Button>

        {/* Account Benefits */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-3">
            🎁 Account Benefits:
          </h4>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>15% off your first order (Code: WELCOME15)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Free same-day delivery in Nairobi</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Priority customer support</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Order tracking and history</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Exclusive member-only deals</span>
            </li>
          </ul>
        </div>
      </form>
    </Form>
  );
}
