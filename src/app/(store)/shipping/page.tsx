// app/(store)/shipping/page.jsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Clock,
  Smartphone,
  Shield,
  CheckCircle,
  MapPin,
  Zap,
  Battery,
  Home,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery Nairobi | Blessed Two Electronics",
  description:
    "Fast shipping and delivery options for Blessed Two Electronics lighting products. Same-day Nairobi delivery, upcountry shipping, and professional installation services across Kenya.",
  keywords: [
    "shipping Nairobi",
    "delivery Kenya",
    "same-day delivery",
    "lighting delivery",
    "electronics shipping",
  ],
  openGraph: {
    title: "Shipping & Delivery | Blessed Two Electronics",
    description:
      "Same-day delivery in Nairobi and nationwide shipping for quality lighting solutions.",
  },
  alternates: {
    canonical: "/shipping",
  },
};

export default function ShippingPage() {
  return (
    <div className="container py-8 px-2 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-center">
          Shipping & Delivery
        </h1>

        <p className="text-lg text-muted-foreground text-center mb-10 max-w-3xl mx-auto">
          Fast, reliable delivery of lighting solutions across Kenya from
          Blessed Two Electronics
        </p>

        {/* Main Shipping Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-6 mb-10 text-white">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <Truck className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">
                Same-Day Nairobi Delivery Available
              </h3>
              <p className="opacity-90">
                Order by 2PM for same-day delivery within Nairobi. Free delivery
                for orders above KES 3,000.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-white text-blue-600 hover:bg-white/90"
            >
              <Link href="/products">Shop Now</Link>
            </Button>
          </div>
        </div>

        {/* Shipping at a Glance */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            Delivery Options & Timelines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow border-blue-200">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  Same Day
                </div>
                <div className="text-base font-semibold mb-2">
                  Nairobi Express
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                  <Clock className="w-3 h-3 mr-1" />
                  Order by 2PM, delivered today
                </div>
                <p className="text-xs text-gray-500">
                  KES 500 or FREE above KES 3,000
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-green-200">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  1-3 Days
                </div>
                <div className="text-base font-semibold mb-2">
                  Standard Delivery
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                  <Clock className="w-3 h-3 mr-1" />
                  Nairobi & major towns
                </div>
                <p className="text-xs text-gray-500">
                  KES 200-500 via trusted partners
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-amber-200">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  3-7 Days
                </div>
                <div className="text-base font-semibold mb-2">
                  Upcountry Delivery
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                  <Clock className="w-3 h-3 mr-1" />
                  All across Kenya
                </div>
                <p className="text-xs text-gray-500">
                  Via bus freight or courier
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* Processing Details */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">
                Order Processing & Dispatch
              </h2>
              <div className="space-y-6">
                <div className="p-6 border rounded-lg bg-blue-50/30">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Quick Processing Time
                  </h3>
                  <p className="mb-3">
                    Most orders are processed within <strong>2-4 hours</strong>{" "}
                    during business hours. For urgent needs, call us at{" "}
                    <strong>+254 727 833 691</strong> for expedited processing.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      M-Pesa orders processed instantly
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      Stock checked before dispatch
                    </span>
                  </div>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-green-600" />
                    Delivery Methods
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">
                            1
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">In-House Delivery Team</h4>
                        <p className="text-sm text-gray-600">
                          For Nairobi CBD and surrounding areas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-green-600">
                            2
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">Partner Couriers</h4>
                        <p className="text-sm text-gray-600">
                          G4S, Sendy, and other trusted logistics partners
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-amber-600">
                            3
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">Bus Freight</h4>
                        <p className="text-sm text-gray-600">
                          For upcountry deliveries to all major towns
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Special Considerations for Lighting Products */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">
                Special Handling for Lighting Products
              </h2>
              <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Fragile Items
                    </h3>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                        <span>All glass items specially packed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                        <span>Extra cushioning for bulbs and tubes</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Battery className="w-4 h-4" />
                      Electrical Safety
                    </h3>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                        <span>Batteries packed separately for safety</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                        <span>Waterproof packaging for outdoor lights</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Installation Services */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">
                Professional Installation Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-blue-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Home className="w-5 h-5 text-blue-600" />
                      Basic Installation
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Standard installation for most lighting products
                    </p>
                    <div className="text-lg font-bold text-blue-600">
                      From KES 500
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-green-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-600" />
                      Solar System Installation
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Complete setup including mounting and testing
                    </p>
                    <div className="text-lg font-bold text-green-600">
                      From KES 2,000
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>

          {/* Sidebar with Important Info */}
          <div>
            <Card className="sticky top-6 mb-6 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Store Pickup Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-gray-600">
                      Duruma Road, Nairobi
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Hours</p>
                    <p className="text-sm text-gray-600">
                      Mon-Sat: 8AM-6PM
                      <br />
                      Sun: 10AM-4PM
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contact</p>
                    <p className="text-sm text-gray-600">+254 727 833 691</p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full mt-4 border-blue-300"
                >
                  <a
                    href="https://maps.google.com/?q=Duruma+Road+Nairobi"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Directions
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">
                  Business & Bulk Orders
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Special shipping arrangements for:
                </p>
                <ul className="text-sm space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Contractors & Electricians
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Hotels & Commercial Buildings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Real Estate Developers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Orders above KES 50,000
                  </li>
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-blue-300"
                >
                  <Link href="/contact">Request Bulk Quote</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 pt-8 border-t text-center">
          <h3 className="text-xl font-semibold mb-3">
            Need Expert Lighting Advice?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our lighting specialists can help you choose the perfect products
            and arrange convenient delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-500"
            >
              <Link href="/contact">Consult Our Experts</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="tel:+254727833691">
                <Smartphone className="w-4 h-4 mr-2" />
                Call: +254 727 833 691
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
