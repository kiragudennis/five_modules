// app/(store)/returns/page.jsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Truck,
  Smartphone,
  Clock,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Zap,
  Battery,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ReturnsPage() {
  return (
    <div className="container py-8 px-2 mx-auto max-w-5xl">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-center">
          Returns, Refunds & Exchange Policy
        </h1>

        <p className="text-lg text-muted-foreground text-center mb-10 max-w-3xl mx-auto">
          Quality lighting solutions with customer satisfaction guarantee at
          Blessed Two Electronics
        </p>

        {/* Trust Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-6 mb-10 text-white">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">
                2-Year Warranty on All Products
              </h3>
              <p className="opacity-90">
                At Blessed Two Electronics, we stand by our products. All
                lighting solutions come with a comprehensive 2-year warranty for
                peace of mind.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* Electronics-Specific Return Policy */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">
                Lighting & Electronics Return Guidelines
              </h2>
              <p className="mb-6">
                As specialists in lighting solutions, we have tailored return
                policies that account for the unique nature of electrical
                products.
              </p>

              <div className="space-y-8">
                <div className="p-6 border border-blue-200 rounded-lg bg-blue-50/50 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    7-Day Return Window for Non-Faulty Items
                  </h3>
                  <p className="mb-3">
                    Change your mind? Return unused, unopened items within 7
                    days of delivery for a full refund or exchange.
                  </p>
                  <div className="bg-white rounded p-4 border">
                    <p className="text-sm font-medium mb-1">
                      Conditions for Return:
                    </p>
                    <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                      <li>Original packaging must be intact</li>
                      <li>All accessories and manuals included</li>
                      <li>Product must not be installed or used</li>
                      <li>Proof of purchase required</li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Faulty or Defective Products
                  </h3>
                  <p className="mb-3">
                    For products that are faulty or don't work as expected, we
                    offer extended support:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded p-3 bg-amber-50/50">
                      <h4 className="font-semibold mb-1">Within 30 Days</h4>
                      <p className="text-sm text-gray-600">
                        Full refund or replacement with free pickup
                      </p>
                      <div className="mt-2 text-xs text-green-600">
                        For manufacturing defects
                      </div>
                    </div>
                    <div className="border rounded p-3 bg-blue-50/50">
                      <h4 className="font-semibold mb-1">
                        2-Year Warranty Period
                      </h4>
                      <p className="text-sm text-gray-600">
                        Repair or replacement for warranty-covered issues
                      </p>
                      <div className="mt-2 text-xs text-blue-600">
                        Excludes physical damage or misuse
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-600" />
                    Return Process & Shipping
                  </h3>
                  <p className="mb-3">
                    Easy return options tailored for Nairobi and Kenya-wide
                    customers:
                  </p>
                  <div className="overflow-x-auto rounded-lg border mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Return Method
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Cost
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Best For
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-3 text-sm">
                            Store Return (Duruma Rd)
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600">
                            FREE
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            Nairobi residents, quickest option
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm">
                            Scheduled Pickup
                          </td>
                          <td className="px-4 py-3 text-sm">KES 200-500</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            Greater Nairobi area
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm">
                            Courier Drop-off
                          </td>
                          <td className="px-4 py-3 text-sm">
                            Customer pays actuals
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            Upcountry customers
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Special Cases */}
                <div className="p-6 border border-amber-200 rounded-lg bg-amber-50/50">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    Special Considerations for Lighting Products
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-2"></div>
                      <span className="text-sm">
                        <strong>Solar Products:</strong> Batteries have 1-year
                        warranty separate from main product
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-2"></div>
                      <span className="text-sm">
                        <strong>Installation Services:</strong> Installation
                        fees are non-refundable once service is rendered
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-2"></div>
                      <span className="text-sm">
                        <strong>Custom Orders:</strong> Made-to-order products
                        cannot be returned unless defective
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Refunds Process */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">Refund Processing</h2>

              <div className="bg-blue-50 rounded-lg p-5 mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  M-Pesa Refunds (Most Common)
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">
                      Processed within 24-48 hours of receiving returned item
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      Refunded to original payment method
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">
                      SMS notification sent upon refund initiation
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Store Credit Option</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Opt for store credit and get 10% bonus on your refund amount
                  </p>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    Valid for 1 year
                  </span>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Exchange Process</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Exchange for another product with price difference
                    adjustment
                  </p>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    Priority shipping for exchanges
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Important Information */}
          <div>
            <Card className="sticky top-6 mb-6 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  Quick Reference
                </h3>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Return Window:</strong> 7 days for non-faulty, 30
                      days for defective
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Battery className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Warranty:</strong> 2 years on products, 1 year on
                      batteries
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Installation:</strong> Test products upon
                      installation
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Smartphone className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Contact:</strong> WhatsApp +254 727 833 691 for
                      quick assistance
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">
                  Need Help With Returns?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Our lighting experts are here to help you with any return or
                  exchange questions.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-green-500" />
                    <span className="text-sm">+254 727 833 691</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">
                      Mon-Sat: 8AM-6PM, Sun: 10AM-4PM
                    </span>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700"
                >
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 pt-8 border-t text-center">
          <h3 className="text-xl font-semibold mb-3">
            Quality Lighting, Guaranteed
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            At Blessed Two Electronics, we're committed to providing top-quality
            lighting solutions backed by excellent customer service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-500"
            >
              <Link href="/products">Shop Quality Lighting</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Visit Our Duruma Road Store</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
