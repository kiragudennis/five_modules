// app/(store)/about/page.jsx
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { lightingCategories, shopFeatures } from "@/lib/constants";

export default function AboutPage() {
  // Get top 6 popular categories for display
  const popularCategories = lightingCategories
    .filter((cat) => cat.popular)
    .slice(0, 6);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
            <Lightbulb className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent py-2">
          Nairobi&apos;s Premier Lighting Destination
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          At Blessed Two Electronics on Duruma Road, we specialize in premium
          lighting solutions that combine energy efficiency, smart technology,
          and exceptional quality.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Duruma Road, Nairobi, Kenya</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Mon-Sat: 8AM-6PM, Sun: 10AM-4PM</span>
          </div>
        </div>
      </section>

      {/* Our Expertise with Categories */}
      <section className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Comprehensive Lighting Solutions
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            From energy-saving bulbs to complete solar systems, we offer the
            widest range of lighting products in Nairobi.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {popularCategories.map((category) => (
            <div
              key={category.id}
              className="group p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-300 hover:border-amber-300 dark:hover:border-amber-500"
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
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
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
                  className="w-full text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
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
            variant="outline"
            className="border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            <Link href="/categories">
              View All {lightingCategories.length} Categories
            </Link>
          </Button>
        </div>
      </section>

      {/* Why Choose Us with Shop Features */}
      <section className="mb-16">
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
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Customer Promise */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-8 md:p-12">
          <div className="max-w-4xl mx-auto text-center">
            <ShieldCheck className="h-16 w-16 mx-auto mb-6" />
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              Our Customer Promise
            </h3>
            <p className="text-lg md:text-xl mb-8 opacity-95">
              We don&apos;t just sell lighting products—we provide complete
              solutions backed by expert advice, reliable service, and
              comprehensive support.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-2xl md:text-3xl font-bold mb-2">100%</div>
                <div className="text-sm opacity-90">Quality Tested</div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-2xl md:text-3xl font-bold mb-2">24/7</div>
                <div className="text-sm opacity-90">Expert Support</div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-2xl md:text-3xl font-bold mb-2">
                  2-Year
                </div>
                <div className="text-sm opacity-90">Warranty</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Lighting Nairobi Since 2018
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>
                What started as a small lighting shop on Duruma Road has grown
                into Nairobi&apos;s most trusted source for premium lighting
                solutions.
              </p>
              <p>
                Our founder recognized the need for affordable, energy-efficient
                lighting options that could help Kenyan households and
                businesses save on electricity bills while enjoying better
                illumination.
              </p>
              <p>
                Today, we serve thousands of satisfied customers across all 47
                counties, from individual homeowners to large commercial
                establishments. Our commitment remains the same: quality
                products, expert advice, and exceptional service.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  5000+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Customers
                </div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  47
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Counties Served
                </div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  6
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Years Experience
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl border border-amber-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Our Core Values
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                    Quality First
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Every product is tested and certified for performance and
                    safety.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                    Customer Care
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    We believe in building lasting relationships, not just
                    making sales.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                    Expert Knowledge
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Our team provides personalized lighting solutions for your
                    specific needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Our Store */}
      <section className="mb-12">
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900 p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Visit Our Duruma Road Showroom
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Experience our extensive range of lighting products firsthand.
                Our expert staff will help you find the perfect lighting
                solution for your needs.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Blessed Two Electronics, Duruma Road, Nairobi
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Mon-Sat: 8:00 AM - 6:00 PM | Sunday: 10:00 AM - 4:00 PM
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Call: 0727 833 691 for inquiries
                  </span>
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
                    className="border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400"
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
          Electronics for quality lighting solutions that save energy and money.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg"
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
            className="border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            <Link href="/categories">
              Browse Categories
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          Free consultation • Same-day Nairobi delivery • 2-year warranty •
          Expert installation available
        </p>
      </section>
    </div>
  );
}
