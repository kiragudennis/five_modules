// app/(store)/about/page-content.tsx
"use client";

import Link from "next/link";
import {
  MapPin,
  Clock,
  Lightbulb,
  ShieldCheck,
  Award,
  Star,
  Heart,
  Phone,
  MessageCircle,
  ArrowRight,
  Users,
  Truck,
  Shield,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { lightingCategories, shopFeatures } from "@/lib/constants";

export function AboutPageContent() {
  // Get top 6 popular categories for display
  const popularCategories = lightingCategories
    .filter((cat) => cat.popular)
    .slice(0, 6);

  const faqs = [
    {
      question: "Where is Blessed Two Electronics located?",
      answer:
        "We are located at Duruma Road, Nairobi, Kenya. Our showroom is easily accessible and we offer same-day delivery across Nairobi.",
    },
    {
      question: "What are your business hours?",
      answer:
        "We're open Monday to Saturday from 8:00 AM to 6:00 PM, and Sunday from 10:00 AM to 4:00 PM. You can also reach us via WhatsApp 24/7.",
    },
    {
      question: "Do you offer installation services?",
      answer:
        "Yes, we provide professional installation services for all our lighting products. Our certified electricians ensure safe and proper installation.",
    },
    {
      question: "What warranty do your products come with?",
      answer:
        "All our lighting products come with a comprehensive 2-year warranty. Solar batteries have a separate 1-year warranty.",
    },
    {
      question: "Do you deliver outside Nairobi?",
      answer:
        "Yes, we deliver to all 47 counties in Kenya. Shipping costs and delivery times vary depending on your location.",
    },
  ];

  const stats = [
    { value: "5000+", label: "Satisfied Customers", icon: Users },
    { value: "47", label: "Counties Served", icon: MapPin },
    { value: "6+", label: "Years Experience", icon: Award },
    { value: "2-Year", label: "Warranty Guarantee", icon: ShieldCheck },
  ];

  const coreValues = [
    {
      title: "Quality First",
      description:
        "Every product is rigorously tested and certified for performance, safety, and energy efficiency.",
      icon: Star,
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "Customer Care",
      description:
        "We build lasting relationships through personalized service and comprehensive after-sales support.",
      icon: Heart,
      color: "text-red-600 bg-red-50",
    },
    {
      title: "Expert Knowledge",
      description:
        "Our team provides professional lighting consultations and customized solutions for your needs.",
      icon: Award,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Innovation",
      description:
        "We continuously update our product range with the latest energy-saving and smart lighting technologies.",
      icon: Sparkles,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About Blessed Two Electronics",
            description:
              "Nairobi's premier lighting solutions provider since 2018",
            url: "https://blessedtwo.co.ke/about",
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://blessedtwo.co.ke",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "About",
                  item: "https://blessedtwo.co.ke/about",
                },
              ],
            },
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Blessed Two Electronics",
            description:
              "Leading lighting solutions provider in Nairobi offering LED bulbs, solar lighting, security lights, and professional installation services.",
            url: "https://blessedtwo.co.ke",
            logo: "https://blessedtwo.co.ke/logo.png",
            foundingDate: "2018",
            founders: [
              {
                "@type": "Person",
                name: "Founder of Blessed Two Electronics",
              },
            ],
            address: {
              "@type": "PostalAddress",
              streetAddress: "Duruma Road",
              addressLocality: "Nairobi",
              addressRegion: "Nairobi",
              addressCountry: "KE",
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+254727833691",
              contactType: "customer service",
              areaServed: "KE",
              availableLanguage: ["English", "Swahili"],
            },
            sameAs: [
              "https://www.tiktok.com/@blessed_2_electricals",
              "https://www.facebook.com/blessedtwoelectronics",
              "https://www.instagram.com/blessedtwoelectronics",
              "https://twitter.com/blessedtwo",
            ],
          }),
        }}
      />

      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-xl">
              <Lightbulb className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-3 py-1 rounded-full font-bold">
              Since 2018
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Nairobi&apos;s Premier
          </span>
          <br />
          <span className="text-gray-900 dark:text-white">
            Lighting Destination
          </span>
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
          At <strong className="text-blue-600">Blessed Two Electronics</strong>{" "}
          on Duruma Road, we specialize in premium lighting solutions that
          combine <strong>energy efficiency</strong>,{" "}
          <strong>smart technology</strong>, and exceptional{" "}
          <strong>quality</strong> for homes, businesses, and industries across
          Kenya.
        </p>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {stat.value}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Icon className="w-4 h-4" />
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Our Story Section */}
      <section className="mb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-blue-100 dark:border-gray-700">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                <span className="text-blue-600 dark:text-blue-400">
                  Lighting Nairobi
                </span>
                <br />
                Since 2018
              </h2>

              <div className="space-y-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  What started as a small lighting shop on Duruma Road has grown
                  into Nairobi&apos;s most trusted source for premium lighting
                  solutions. Our journey began with a simple vision: to provide
                  Kenyans with access to affordable, energy-efficient lighting
                  that reduces electricity bills while delivering superior
                  illumination.
                </p>

                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Over the years, we&apos;ve evolved from a local retailer to a
                  comprehensive lighting solutions provider, serving thousands
                  of satisfied customers across all 47 counties. From individual
                  homeowners to large commercial establishments, government
                  projects to industrial complexes, we&apos;ve illuminated
                  spaces nationwide.
                </p>

                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Today, our commitment remains unwavering: to deliver{" "}
                  <strong>quality products</strong>, provide{" "}
                  <strong>expert advice</strong>, and ensure{" "}
                  <strong>exceptional service</strong>
                  that exceeds customer expectations.
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  Our Mission
                </h3>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  &quot;To illuminate Kenya with energy-efficient, reliable, and
                  innovative lighting solutions that enhance lives, save costs,
                  and protect our environment.&quot;
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Our Core Values
              </h3>

              <div className="space-y-6">
                {coreValues.map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                    >
                      <div
                        className={`w-12 h-12 rounded-lg ${value.color.split(" ")[1]} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon
                          className={`w-6 h-6 ${value.color.split(" ")[0]}`}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                          {value.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Expertise Section */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Comprehensive Lighting Solutions
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
            From energy-saving bulbs to complete solar systems, we offer
            Nairobi&apos;s widest range of lighting products and solutions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {popularCategories.map((category) => (
            <div
              key={category.id}
              className="group p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 hover:scale-[1.02]"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center flex-shrink-0`}
                >
                  {category.icon && (
                    <category.icon className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {category.description}
                  </p>
                  {category.subcategories && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {category.subcategories.slice(0, 3).map((subcat, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {subcat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Link href={`/category/${category.slug}`}>
                    Browse {category.name}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white"
          >
            <Link href="/categories">
              View All {lightingCategories.length} Lighting Categories
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Why Choose Blessed Two Electronics
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {shopFeatures.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <div
                className={`w-14 h-14 rounded-xl mb-4 bg-gradient-to-r ${feature.color} flex items-center justify-center`}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Customer Promise */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-8 md:p-12">
          <div className="max-w-4xl mx-auto text-center">
            <ShieldCheck className="h-16 w-16 mx-auto mb-6" />
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              Our Customer Promise
            </h3>
            <p className="text-lg md:text-xl mb-8 opacity-95 max-w-3xl mx-auto">
              We don&apos;t just sell lighting products—we provide complete
              solutions backed by expert advice, reliable service, and
              comprehensive support throughout your lighting journey.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <CheckCircle className="h-8 w-8 mx-auto mb-3" />
                <div className="text-sm font-semibold opacity-90">
                  Quality Guaranteed
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <Clock className="h-8 w-8 mx-auto mb-3" />
                <div className="text-sm font-semibold opacity-90">
                  24/7 Support
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <Shield className="h-8 w-8 mx-auto mb-3" />
                <div className="text-sm font-semibold opacity-90">
                  2-Year Warranty
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <Truck className="h-8 w-8 mx-auto mb-3" />
                <div className="text-sm font-semibold opacity-90">
                  Reliable Delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Our Store */}
      <section className="mb-16">
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Visit Our Duruma Road Showroom
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Experience our extensive range of lighting products firsthand.
                Our expert staff will help you find the perfect lighting
                solution tailored to your specific needs and budget.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Location
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 text-sm">
                      Blessed Two Electronics, Duruma Road, Nairobi
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Business Hours
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 text-sm">
                      Mon-Sat: 8:00 AM - 6:00 PM
                      <br />
                      Sunday: 10:00 AM - 4:00 PM
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Contact
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 text-sm">
                      Call: +254 727 833 691
                      <br />
                      WhatsApp Available 24/7
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-lg">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  Need Lighting Advice?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Chat with our experts for personalized recommendations
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Link
                      href="https://wa.me/254727833691?text=Hello%20Blessed%20Two%20Electronics,%20I%20need%20help%20with%20lighting%20solutions"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 w-4 h-4" />
                      WhatsApp Now
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400"
                  >
                    <Link href="/contact">Request Call Back</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Ready to Illuminate Your Space?
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Join thousands of satisfied customers who trust Blessed Two
          Electronics for quality lighting solutions that save energy, reduce
          costs, and enhance your living or working environment.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg"
          >
            <Link href="/products">
              <Lightbulb className="mr-2 w-5 h-5" />
              Shop All Products
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Link href="/categories">
              Browse Categories
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Free lighting consultation
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Same-day Nairobi delivery
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            2-year warranty on all products
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Professional installation available
          </div>
        </div>
      </section>
    </div>
  );
}
