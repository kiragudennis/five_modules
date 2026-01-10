// app/(store)/about/page.jsx
import Link from "next/link";
import {
  CheckCircle,
  Shield,
  Users,
  Target,
  Package,
  CreditCard,
  Smartphone,
  Headphones,
  Globe,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Built for Kenyan Commerce
        </h1>
        <p className="text-xl max-w-3xl mx-auto">
          Custom e-commerce solutions designed specifically for Kenyan
          businesses. Fast deployment, M-Pesa integration, and local support.
        </p>
      </div>

      {/* Mission & Values */}
      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <div>
          <h2 className="text-2xl font-semibold mb-6">Our Mission</h2>
          <p className="mb-4">
            We empower Kenyan businesses to thrive online with custom-built
            e-commerce platforms that understand local market dynamics.
          </p>
          <p className="mb-4">
            Unlike one-size-fits-all solutions, we create tailored online stores
            with M-Pesa integration, inventory management, and customer tools
            designed for Kenyan shoppers.
          </p>
          <p>
            We believe every Kenyan business deserves a professional online
            presence that drives real sales and growth.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Custom solutions built in weeks, not months</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>M-Pesa STK Push & Buy Goods till integration</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>24/7 Kenyan-based support in English & Swahili</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-blue-600" />
            <h3 className="text-2xl font-bold mb-3">Kenyan Market Focus</h3>
            <p className="mb-6">
              We build for the unique needs of Kenyan e-commerce:
            </p>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Mobile-first design</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-sm">M-Pesa integration</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Local logistics</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm">.co.ke domains</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Kenyan Businesses Choose Us
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Fast Deployment</h3>
            <p className="text-muted-foreground">
              Get your custom online store live in 14-21 days, not months. We
              work on accelerated timelines for Kenyan businesses.
            </p>
          </div>

          <div className="p-6 rounded-xl border hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">M-Pesa Ready</h3>
            <p className="text-muted-foreground">
              Full M-Pesa integration from day one—STK Push, Buy Goods till, and
              Lipa Na M-Pesa. Payments working within minutes.
            </p>
          </div>

          <div className="p-6 rounded-xl border hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-400 rounded-full flex items-center justify-center mb-4">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Local Support</h3>
            <p className="text-muted-foreground">
              24/7 support from our Kenyan team. We understand your business,
              your customers, and your market challenges.
            </p>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Our E-commerce Solutions
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl border">
            <h3 className="text-lg font-bold mb-2">Shop Systems</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete e-commerce with inventory, orders, and customer
              management
            </p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                M-Pesa & card payments
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Product catalog management
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Order tracking system
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border">
            <h3 className="text-lg font-bold mb-2">Enterprise Platforms</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Multi-organization management for schools, hospitals, and
              cooperatives
            </p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Custom workflow automation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Advanced user permissions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Multi-location management
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border">
            <h3 className="text-lg font-bold mb-2">Payment Integration</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Seamless payment processing designed for Kenya
            </p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                M-Pesa STK Push
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Buy Goods till numbers
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Card payments (Visa/Mastercard)
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border">
            <h3 className="text-lg font-bold mb-2">Business Automation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Smart workflows that save time and reduce errors
            </p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Automated inventory alerts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                SMS order notifications
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Sales analytics & reports
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-8 md:p-12 mb-16">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold mb-2">20+</div>
            <div className="text-sm opacity-90">Systems Deployed</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold mb-2">14</div>
            <div className="text-sm opacity-90">Days Average Setup</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold mb-2">47</div>
            <div className="text-sm opacity-90">Counties Served</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold mb-2">24/7</div>
            <div className="text-sm opacity-90">Kenyan Support</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-6">
          Ready to Launch Your Online Store?
        </h2>
        <p className="text-xl max-w-2xl mx-auto mb-8">
          Get a custom-built e-commerce solution with M-Pesa integration, mobile
          optimization, and full support.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
          >
            <Link href="/contact">Get Your Custom Quote</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link
              href="https://wa.me/254113062599?text=Hi,%20I'm%20interested%20in%20a%20custom%20e-commerce%20solution%20for%20my%20Kenyan%20business"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp Our Team
            </Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Response within 2 hours • Free consultation • No-obligation quote
        </p>
      </div>
    </div>
  );
}
