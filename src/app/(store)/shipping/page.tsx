// app/(store)/shipping/page.jsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Clock,
  Smartphone,
  AlertCircle,
  HelpCircle,
  Shield,
  MessageCircle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ShippingPage() {
  return (
    <div className="container py-8 px-2 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-center">
          Shipping & Delivery
        </h1>

        <p className="text-lg text-muted-foreground text-center mb-10 max-w-3xl mx-auto">
          From our demo store to real stores: How to get products from an online
          shop to your customers in Kenya.
        </p>

        {/* Demo Store Reference */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                See Shipping in Action: Try Our Demo
              </h3>
              <p className="mb-4">
                This demo store shows how shipping works in a real e-commerce
                platform. You can add items to your cart and proceed to checkout
                to see how shipping options and costs are calculated and applied
                to the order total. This is exactly how a custom store built for
                your business would work.
              </p>
              <Button asChild variant="outline" className="border-blue-300">
                <Link href="/products">Try the Demo Store Checkout Flow</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Shipping at a Glance */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Truck className="w-6 h-6" />
            Shipping Costs & Timelines (Kenyan Context)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  KES 200-500
                </div>
                <div className="text-base font-semibold mb-2">
                  Nairobi & Major Towns
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                  <Clock className="w-3 h-3 mr-1" />
                  1-3 business days
                </div>
                <p className="text-xs text-gray-500">
                  Via local riders or couriers
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  KES 400-800
                </div>
                <div className="text-base font-semibold mb-2">
                  Other Regions in Kenya
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                  <Clock className="w-3 h-3 mr-1" />
                  3-7 business days
                </div>
                <p className="text-xs text-gray-500">
                  Via postal service or bus freight
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-dashed">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-gray-400 mb-1">
                  Varies
                </div>
                <div className="text-base font-semibold mb-2">
                  Custom/Advanced
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                  <Clock className="w-3 h-3 mr-1" />
                  Configurable
                </div>
                <p className="text-xs text-gray-500">
                  Real-time rates, pickup points, etc.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* Processing Time */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">
                How Order Processing Works
              </h2>
              <p className="mb-4">
                In a professional online store, like the one in our demo, the
                process is automated. Once a customer places an order and pays
                (e.g., via M-Pesa), the system can notify the seller, update
                inventory, and provide an estimated dispatch timeline—typically{" "}
                <strong>1-2 business days</strong>.
              </p>
            </section>

            {/* Shipping Rates & Estimates */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">
                Configurable Shipping & Delivery
              </h2>
              <p className="mb-4">
                Every business is different. A custom store lets you set up
                shipping rules that match your operations:
              </p>

              <div className="overflow-x-auto rounded-lg border mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        What You Can Configure
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        Example from Our Demo
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        Benefit for Your Business
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        Flat-Rate or Zone-Based Fees
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        Fixed KES 300 for Nairobi
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        Simple, predictable costs for you and your customers.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        Real-Time Carrier Rates
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        Fetch rates from Sendy, G4S API
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        Customers see exact cost; you don't over/under charge.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        Free Shipping Thresholds
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        Free delivery on orders over KES 2,500
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        Powerful incentive to increase average order value.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        Local Pickup Points
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        Select "Pick up at Nakumatt"
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        Saves you delivery costs, convenient for customers.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* For Social Sellers */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="w-6 h-6" />
                From Manual to Automated: For Social Media Sellers
              </h2>
              <p className="mb-3">
                If you currently sell on WhatsApp, Instagram, or TikTok, you
                know the drill: a customer DMs, you quote a price{" "}
                <em>including delivery</em>, they pay via M-Pesa, you arrange a
                rider.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 my-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  The Pain Point & The Solution
                </h3>
                <p className="text-sm">
                  This manual process doesn't scale. A custom store automates
                  it: the customer selects their location, the system{" "}
                  <strong>calculates and adds the exact shipping fee</strong>{" "}
                  (just like in our demo), they pay, and you get a clear order
                  slip with all details—no back-and-forth DMs needed.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar with Key Tips */}
          <div>
            <Card className="sticky top-6 mb-6">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Why Professional Shipping Matters
                </h3>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Trust & Professionalism:</strong> Clear, automated
                      checkout builds more trust than negotiated DMs.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Saves You Time:</strong> Automates quoting,
                      invoicing, and basic customer questions about delivery.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Reduces Errors:</strong> No more miscalculated
                      fees or sending to the wrong pickup station.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Smartphone className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Grows with You:</strong> Systems can integrate
                      with inventory and account for complex rules.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">
                  This Can Be Your Store's Reality
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  The checkout flow you see in our demo isn't just a template.
                  We build <strong>custom logic</strong> for your specific
                  products, delivery zones, and preferred couriers.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/contact">Discuss Your Shipping Needs</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 pt-8 border-t text-center">
          <h3 className="text-xl font-semibold mb-3">
            Ready to Automate Your Sales & Shipping?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Stop calculating delivery fees in your head. Let's build a system
            that does it for you, boosts customer trust, and helps your business
            grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-500"
            >
              <Link href="/contact">Get Your Custom Store Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/products">Explore the Demo First</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
