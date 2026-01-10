// app/(store)/contact/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  MessageCircle,
  Globe,
  Truck,
  Shield,
  Users,
  Smartphone,
  CreditCard,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ContactForm from "@/components/contact-form";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-20">
        <div className="absolute inset-0 bg-[url('/patterns/abstract-timekeeper.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Let's Build Your Online Store
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
              Get a custom e-commerce solution for your business. Fast.
              Reliable. Profitable.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Shield className="w-4 h-4" />
                <span className="text-sm">
                  Trusted by 50+ Kenyan Businesses
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="text-sm">14-Day Launch Timeline</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Star className="w-4 h-4" />
                <span className="text-sm">24/7 Kenyan Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto sm:px-4 px-2 py-16 max-w-6xl">
        {/* Contact Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Contact Form */}
          <Card className="shadow-xl border-0 dark:border dark:border-gray-800">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">
                Get Your Free Quote
              </CardTitle>
              <CardDescription className="text-lg">
                Tell us about your business. We'll respond within 2 hours.
              </CardDescription>
            </CardHeader>
            <ContactForm />
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Quick Response Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      Fast Response Time
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      We know Kenyan businesses move fast. Get a response within
                      2 hours during business hours.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Typically responds: 45 minutes
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Methods */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Call Us</h3>
                      <p className="text-sm text-muted-foreground">
                        Speak directly
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    +254 113 062 599
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Mon-Fri, 8am-6pm EAT
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Email Us</h3>
                      <p className="text-sm text-muted-foreground">
                        Detailed inquiries
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2">
                    support@worldsamma.org
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Response within 48 hours
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Business Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Monday - Friday</span>
                    <span className="font-bold">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Saturday</span>
                    <span className="font-bold">9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Sunday & Holidays</span>
                    <span className="font-bold text-red-600">Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Our Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="font-medium">Nairobi, Kenya</p>
                  <p className="text-sm text-muted-foreground">
                    We work with businesses across the world. Most consultations
                    are done online for your convenience.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Kenyan Businesses Choose Us
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We build e-commerce solutions that understand the Kenyan market
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: CreditCard,
                title: "M-Pesa Integration",
                description:
                  "Seamless mobile money payments from day one. Lipa Na M-Pesa, Buy Goods till, and more.",
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: Truck,
                title: "Kenyan Logistics",
                description:
                  "Integrated with local couriers. We handle the complexities of delivery across Kenya.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Smartphone,
                title: "Mobile-First Design",
                description:
                  "90% of Kenyan shoppers use mobile. Your store will be optimized for phones.",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Shield,
                title: "Security First",
                description:
                  "SSL certificates, secure payment gateways, and regular security updates included.",
                color: "from-amber-500 to-yellow-500",
              },
              {
                icon: Users,
                title: "Dedicated Support",
                description:
                  "24/7 Kenyan support team that understands your business and speaks your language.",
                color: "from-red-500 to-orange-500",
              },
              {
                icon: Globe,
                title: "Multi-Channel Sales",
                description:
                  "Sell on Instagram, WhatsApp, and Facebook Marketplace from one dashboard.",
                color: "from-indigo-500 to-blue-500",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Common questions from Kenyan business owners
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                question: "How much does a custom online store cost?",
                answer:
                  "Prices start from KES 30,000 for a basic store and scale based on features. We provide a detailed quote after understanding your specific needs.",
              },
              {
                question: "How long does it take to launch?",
                answer:
                  "Most stores are live within 14-21 days. We work on an accelerated timeline to get you selling online quickly.",
              },
              {
                question: "Do you provide training?",
                answer:
                  "Yes! We provide comprehensive training for you and your team, plus detailed documentation and video tutorials.",
              },
              {
                question: "What about hosting and maintenance?",
                answer:
                  "We handle everything - hosting, domain setup, SSL certificates, security updates, and regular backups.",
              },
              {
                question: "Can I sell on social media too?",
                answer:
                  "Absolutely! Your store integrates with Instagram, Facebook, WhatsApp, and Jumia for multi-channel selling.",
              },
              {
                question: "Do you offer payment plans?",
                answer:
                  "Yes, we offer flexible payment options including 40% upfront and 60% on completion for most projects.",
              },
            ].map((faq, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        Q
                      </span>
                    </div>
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground pl-9">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Grow Your Business Online?
              </h2>
              <p className="text-xl opacity-90 mb-8">
                Join 50+ successful Kenyan businesses already selling online
                with our platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-white/90 font-bold px-8 py-6 text-lg"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call Now: +254 113 062 599
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="link"
                  className="border-2 border-white hover:bg-white/10 font-bold px-8 py-6 text-lg"
                >
                  <Link
                    href="https://wa.me/254113062599?text=Hi,%20I'm%20interested%20in%20getting%20a%20custom%20online%20store%20built%20for%20my%20business"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    WhatsApp for Quote
                  </Link>
                </Button>
              </div>
              <p className="mt-6 text-sm opacity-80">
                Free consultation • No-obligation quote • 24-hour response time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
