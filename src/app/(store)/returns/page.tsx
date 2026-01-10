// app/(store)/returns/page.jsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Shield,
  Truck,
  Smartphone,
  Clock,
  HelpCircle,
  CheckCircle,
  AlertCircle,
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
          How returns work in your custom online store—designed for Kenyan
          businesses with your specific needs in mind.
        </p>

        {/* Custom Returns Framework */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                This Isn't Just a Policy—It's Your Business Framework
              </h3>
              <p className="mb-4">
                The returns policy below demonstrates how we build{" "}
                <strong>customizable solutions</strong> for your store. Unlike
                rigid templates, your platform can be configured based on your
                products, logistics setup, and business model.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configurable Return Windows
                </span>
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Flexible Return Methods
                </span>
                <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-medium text-purple-800 dark:text-purple-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Automated Refund Processing
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* Sample Policy Structure */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">
                Your Custom Returns Framework
              </h2>
              <p className="mb-6">
                This is a sample of how returns can be structured in your store.
                Every element can be customized based on what you sell and how
                you operate.
              </p>

              <div className="space-y-8">
                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Configurable Return Window
                  </h3>
                  <p className="mb-3">
                    We recommend a <strong>7-14 day return window</strong> for
                    most Kenyan businesses. This balances customer satisfaction
                    with practical logistics.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-4">
                    <p className="text-sm font-medium mb-1">
                      Your Input Determines This:
                    </p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 space-y-1">
                      <li>
                        <strong>Perishable goods?</strong> → Shorter window (3-7
                        days)
                      </li>
                      <li>
                        <strong>Electronics?</strong> → Extended window (14-30
                        days)
                      </li>
                      <li>
                        <strong>Custom-made items?</strong> → No returns or
                        strict conditions
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-green-600" />
                    Flexible Return Methods
                  </h3>
                  <p className="mb-3">
                    Your store can support multiple return options depending on
                    your setup:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded p-3">
                      <h4 className="font-semibold mb-1">
                        Physical Store Return
                      </h4>
                      <p className="text-sm text-gray-600">
                        Customers return items to your shop location
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                        Best for: Businesses with physical presence
                      </div>
                    </div>
                    <div className="border rounded p-3">
                      <h4 className="font-semibold mb-1">Courier Pickup</h4>
                      <p className="text-sm text-gray-600">
                        Schedule pickup with a local courier
                      </p>
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        Best for: Large/heavy items
                      </div>
                    </div>
                    <div className="border rounded p-3">
                      <h4 className="font-semibold mb-1">
                        Designated Drop-off
                      </h4>
                      <p className="text-sm text-gray-600">
                        Return to partner shops or pickup stations
                      </p>
                      <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                        Best for: Wide customer base
                      </div>
                    </div>
                    <div className="border rounded p-3">
                      <h4 className="font-semibold mb-1">Postal Return</h4>
                      <p className="text-sm text-gray-600">
                        Return via Posta or similar service
                      </p>
                      <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        Best for: Low-value items nationwide
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-600" />
                    Return Shipping & Costs
                  </h3>
                  <p className="mb-3">
                    This is often the trickiest part for Kenyan businesses. Your
                    store can be configured with clear policies:
                  </p>
                  <div className="overflow-x-auto rounded-lg border mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Return Reason
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Who Pays?
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Customer Impact
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-3 text-sm">
                            Wrong item / Damaged
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600">
                            You (the business)
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            Full refund + free return
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm">
                            Changed mind / Wrong size
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-amber-600">
                            Customer pays return shipping
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            Refund minus shipping costs
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm">
                            Defective after use
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            Case-by-case
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            Warranty claim process
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Pro tip:</strong> Consider offering "free returns"
                    as a premium service for orders above a certain value. This
                    builds trust and can increase sales.
                  </p>
                </div>
              </div>
            </section>

            {/* Refunds Process */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">
                Automated Refund Processing
              </h2>
              <p className="mb-4">
                Your custom store can handle refunds automatically, saving you
                countless hours of manual work.
              </p>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  M-Pesa Refund Integration
                </h3>
                <p className="mb-3">
                  For Kenyan customers who paid via M-Pesa, your store can be
                  configured to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>
                    Automatically process refunds to the same phone number
                  </li>
                  <li>Send SMS notifications when refund is initiated</li>
                  <li>Track all refunds in your admin dashboard</li>
                  <li>Handle partial refunds for exchanges</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Sidebar - Implementation Guide */}
          <div>
            <Card className="sticky top-6 mb-6">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  Building Your Returns Policy
                </h3>
                <p className="text-sm mb-4">
                  When we build your store, we'll help you decide on these key
                  elements:
                </p>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Product Type:</strong> Clothing needs different
                      rules than electronics or food items
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Logistics Setup:</strong> Do you have a physical
                      store for returns?
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Cost Management:</strong> How will you handle
                      return shipping costs?
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Customer Communication:</strong> Automated
                      emails/SMS for each return stage
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">
                  Returns in Your Admin Dashboard
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Your custom admin panel will include a complete returns
                  management system:
                </p>
                <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Track return requests and status
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Process refunds with one click
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Generate return labels for customers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Analytics on return rates and reasons
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/contact">See Admin Demo</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 pt-8 border-t text-center">
          <h3 className="text-xl font-semibold mb-3">
            Need a Returns System That Works for Your Business?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Don't settle for a generic returns policy. Let's build one that
            protects your business while keeping customers happy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-500"
            >
              <Link href="/contact">Discuss Your Returns Strategy</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/shipping">Review Shipping Options</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
