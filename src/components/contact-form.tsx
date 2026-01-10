"use client";

import { useState } from "react";
import { CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [estimatedOrders, setEstimatedOrders] = useState("1-50");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      business: formData.get("business"),
      message: formData.get("message"),
      orders: estimatedOrders,
    };

    // Validate required fields
    if (
      !data.name ||
      !data.phone ||
      !data.email ||
      !data.business ||
      !data.message ||
      !data.orders
    ) {
      toast.error("Missing Information");
      setIsSubmitting(false);
      return;
    }

    // Send email via your API route
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      setIsSubmitted(true);
      toast.success("Success!");

      // Reset form
      form.reset();
      setEstimatedOrders("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to submit your inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CardContent>
      {isSubmitted ? (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-bold">Thank You!</h3>
          <p className="text-muted-foreground">
            We've received your inquiry and will contact you within 2 hours.
          </p>
          <div className="pt-4 space-y-3">
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="w-full"
            >
              Submit Another Inquiry
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <a href="/products">Browse Demo Store</a>
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="John Kamau"
                className="h-12"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+254 7XX XXX XXX"
                className="h-12"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="hello@yourbusiness.co.ke"
              className="h-12"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business">
              Business Type <span className="text-red-500">*</span>
            </Label>
            <Select name="business" required disabled={isSubmitting}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select your business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fashion">Fashion & Clothing</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="home">Home & Furniture</SelectItem>
                <SelectItem value="beauty">Beauty & Cosmetics</SelectItem>
                <SelectItem value="groceries">Groceries & Food</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              Project Details <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell us about your business, products, and what you need in your online store..."
              className="min-h-[150px]"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-3">
            <Label>Estimated Monthly Orders</Label>
            <RadioGroup
              value={estimatedOrders}
              onValueChange={setEstimatedOrders}
              className="grid grid-cols-3 gap-2"
              disabled={isSubmitting}
            >
              <div className="relative">
                <RadioGroupItem
                  value="1-50"
                  id="orders-1-50"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="orders-1-50"
                  className="flex h-12 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  1-50
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem
                  value="50-200"
                  id="orders-50-200"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="orders-50-200"
                  className="flex h-12 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  50-200
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem
                  value="200+"
                  id="orders-200"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="orders-200"
                  className="flex h-12 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  200+
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-lg font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              "Get Custom Quote →"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            We'll send you a detailed proposal within 24 hours
          </p>
        </form>
      )}
    </CardContent>
  );
}
