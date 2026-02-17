// app/terms/page.js
import Link from "next/link";
import {
  FileText,
  Scale,
  Mail,
  Phone,
  MapPin,
  Zap,
  Shield,
  Lightbulb,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Blessed Two Electronics Nairobi",
  description:
    "Terms and conditions for purchasing lighting products from Blessed Two Electronics. Warranty information, installation services, and business customer terms.",
  keywords: [
    "terms of service",
    "conditions of sale",
    "warranty terms",
    "installation services",
    "business terms",
  ],
  openGraph: {
    title: "Terms of Service | Blessed Two Electronics",
    description:
      "Terms and conditions for purchasing quality lighting solutions in Nairobi.",
  },
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsOfService() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto px-2 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <FileText className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-lg text-muted-foreground">
          Blessed Two Electronics - Effective: {currentDate}
        </p>
      </div>

      <div className="space-y-10">
        {/* Introduction */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-6 rounded-lg border border-blue-200">
          <h1 className="text-3xl font-bold mb-4 text-blue-900 dark:text-blue-100">
            Welcome to Blessed Two Electronics
          </h1>
          <p className="text-lg font-medium mb-4">
            These terms govern your use of our website and purchase of lighting
            solutions from Blessed Two Electronics, your trusted partner for
            quality illumination since 2010.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
              <Zap className="w-3 h-3 mr-1" />
              Lighting Specialists
            </span>
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">
              <Shield className="w-3 h-3 mr-1" />
              2-Year Warranty
            </span>
            <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-medium text-purple-800 dark:text-purple-300">
              <Lightbulb className="w-3 h-3 mr-1" />
              Professional Installation
            </span>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" /> 1. Acceptance of Terms
          </h2>
          <p className="text-base leading-relaxed">
            By accessing our website or purchasing products from Blessed Two
            Electronics, you agree to be bound by these Terms of Service and all
            applicable laws and regulations in Kenya. If you do not agree with
            any part of these terms, you must not use our website or services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            2. Product Information & Accuracy
          </h2>
          <div className="bg-yellow-50/50 rounded-lg p-4">
            <p className="text-base leading-relaxed">
              <strong>Important:</strong> While we strive for accuracy, lighting
              products may appear slightly different in color or brightness due
              to screen settings, room conditions, and other factors.
            </p>
          </div>
          <ul className="list-disc pl-6 space-y-2">
            <li className="text-base leading-relaxed">
              Product specifications are subject to change without notice as
              manufacturers update their products
            </li>
            <li className="text-base leading-relaxed">
              Wattage, lumens, and color temperature specifications are
              approximate
            </li>
            <li className="text-base leading-relaxed">
              Images are for illustrative purposes only
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Ordering & Payment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Order Confirmation</h4>
              <p className="text-sm text-gray-600">
                Your order is confirmed once payment is verified. We reserve the
                right to cancel orders in case of pricing errors or stock
                unavailability.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Payment Methods</h4>
              <p className="text-sm text-gray-600">
                We accept M-Pesa, Visa, Mastercard, and Lipa Pole Pole. All
                payments are processed securely through certified payment
                gateways.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Pricing & Taxes</h2>
          <p className="text-base leading-relaxed">
            All prices are in Kenyan Shillings (KES) and include VAT where
            applicable. We reserve the right to adjust prices due to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li className="text-base leading-relaxed">
              Currency fluctuations affecting import costs
            </li>
            <li className="text-base leading-relaxed">
              Changes in government taxes or levies
            </li>
            <li className="text-base leading-relaxed">
              Manufacturer price adjustments
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Delivery & Installation</h2>
          <p className="text-base leading-relaxed">
            Please refer to our{" "}
            <Link
              href="/shipping"
              className="text-blue-600 underline hover:no-underline"
            >
              Shipping Policy
            </Link>{" "}
            for detailed delivery information. Key points:
          </p>
          <div className="bg-blue-50/50 rounded-lg p-4">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                <span className="text-sm">
                  Delivery times are estimates and not guarantees
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                <span className="text-sm">
                  Risk of loss transfers to you upon delivery
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                <span className="text-sm">
                  Installation services are separate from product purchase
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Returns & Warranty</h2>
          <p className="text-base leading-relaxed">
            Please review our comprehensive{" "}
            <Link
              href="/returns"
              className="text-blue-600 underline hover:no-underline"
            >
              Returns Policy
            </Link>
            . Our warranty terms:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
              <h4 className="font-semibold mb-2">Standard Warranty</h4>
              <p className="text-sm text-gray-600">
                2-year warranty on all lighting products from date of purchase
              </p>
            </div>
            <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/50">
              <h4 className="font-semibold mb-2">Warranty Exclusions</h4>
              <p className="text-sm text-gray-600">
                Physical damage, improper installation, or use outside
                specifications
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Professional Services</h2>
          <p className="text-base leading-relaxed">
            For installation and consultation services:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li className="text-base leading-relaxed">
              Installation quotes are valid for 30 days
            </li>
            <li className="text-base leading-relaxed">
              Cancellation within 24 hours of scheduled installation may incur a
              fee
            </li>
            <li className="text-base leading-relaxed">
              Our technicians are certified and insured
            </li>
            <li className="text-base leading-relaxed">
              Site assessment may be required for complex installations
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">8. Business Customers</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-base leading-relaxed">
              For contractors, electricians, and business clients:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li className="text-base leading-relaxed">
                Trade pricing available upon registration
              </li>
              <li className="text-base leading-relaxed">
                Credit terms may be available for established businesses
              </li>
              <li className="text-base leading-relaxed">
                Bulk order discounts negotiable
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">9. Limitation of Liability</h2>
          <p className="text-base leading-relaxed">
            Blessed Two Electronics shall not be liable for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li className="text-base leading-relaxed">
              Indirect, incidental, or consequential damages
            </li>
            <li className="text-base leading-relaxed">
              Damages resulting from improper installation or use
            </li>
            <li className="text-base leading-relaxed">
              Issues caused by power surges or electrical faults outside our
              control
            </li>
            <li className="text-base leading-relaxed">
              Loss of profits or business interruption
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">10. Governing Law</h2>
          <p className="text-base leading-relaxed">
            These Terms shall be governed by and construed in accordance with
            the laws of Kenya. Any disputes shall be subject to the exclusive
            jurisdiction of the courts of Nairobi, Kenya.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" /> 11. Contact Information
          </h2>
          <div className="bg-blue-50/50 p-6 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-medium">Blessed Two Electronics</p>
                <p className="text-sm text-gray-600">
                  Duruma Road, Nairobi
                  <br />
                  Kenya
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-medium">General Inquiries</p>
                <p className="text-sm text-gray-600">
                  info@blessedtwoelectronics.com
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-medium">Sales & Support</p>
                <p className="text-sm text-gray-600">+254 727 833 691</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Our customer service team is available Monday to Saturday, 8:00 AM
            to 6:00 PM.
          </p>
        </section>
      </div>
    </div>
  );
}
