// Landing page for Blessed Two Electronics
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Product, Coupon } from "@/types/store";
import { formatCurrency } from "@/lib/utils";
import { ProductCardSkeleton } from "@/components/ProductSkeleton";
import { Suspense } from "react";
import {
  ChevronDown,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users,
  Star,
  Quote,
  Headphones,
  CreditCard,
  Lightbulb,
  Home as HomeIcon,
  Award,
  Clock,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  Bolt,
  CheckCircle,
  Badge,
} from "lucide-react";
import {
  AnimatedSection,
  CompactSection,
} from "@/components/ui/animated-section";
import { DealOfTheDaySection } from "@/components/deal-of-the-day";
import { Badge as ShadBadge } from "@/components/ui/badge";
import CopyCouponBar from "@/components/copy-coupon";
import { lightingCategories, shopFeatures } from "@/lib/constants";

async function fetchFeatured() {
  let featuredProducts: Product[] = [];
  let coupons: Coupon[] = [];

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/products/featured`,
      {
        next: { revalidate: 1800 },
      },
    );

    if (response.ok) {
      const data = await response.json();
      featuredProducts = data.products || [];
      coupons = data.coupons || [];
    } else {
      console.error("Failed to fetch featured products:", response.status);
    }
  } catch (error) {
    console.error("Error fetching featured products:", error);
  }
  return { featuredProducts, coupons };
}

function FeaturedProductsGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
      {products.map((product, index) => (
        <AnimatedSection
          key={product.id}
          delay={0.05 * index}
          animation="fadeUp"
          className="h-full"
          spacing="none"
          once
        >
          <Link
            href={`/products/${product.slug}`}
            className="group relative overflow-hidden rounded-xl border bg-background shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1"
          >
            {/* Deal of the Day Badge */}
            {product.isDealOfTheDay && (
              <div className="absolute top-2 left-2 z-10">
                <div className="bg-gradient-to-r from-amber-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  🔥 DEAL OF THE DAY
                </div>
              </div>
            )}

            {/* Product Rating */}
            <div className="absolute top-2 right-2 z-10">
              {product.rating && (
                <div className="bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-xs">
                    ({product.reviewsCount})
                  </span>
                </div>
              )}
            </div>
            <div className="aspect-square relative flex-shrink-0">
              {product.images?.[0] ? (
                <>
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 480px) 50vw,
                           (max-width: 768px) 33vw,
                           (max-width: 1024px) 25vw,
                           20vw"
                    priority={false}
                  />
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-70" />

                  {/* Text overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                    <h3 className="font-semibold text-sm sm:text-base line-clamp-2 mb-1 transition-colors group-hover:text-amber-300">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white bg-black/40 px-2 py-0.5 rounded">
                          {formatCurrency(product.price, product.currency)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(
                              product.originalPrice,
                              product.currency,
                            )}
                          </span>
                        )}
                      </div>
                      {product.category === "solar" && (
                        <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-sm px-2 py-0.5 rounded text-xs capitalize border border-amber-500/30">
                          ☀️ {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
                  <Lightbulb className="w-8 h-8" />
                </div>
              )}
            </div>
          </Link>
        </AnimatedSection>
      ))}
    </div>
  );
}

function CategoriesGrid({
  categories,
}: {
  categories: Array<{
    name: string;
    slug: string;
    icon: any;
    description: string;
  }>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
      {categories.map((category, index) => (
        <AnimatedSection
          key={category.slug}
          delay={0.05 * index}
          animation="fadeUp"
          className="h-full"
          spacing="none"
          once
        >
          <Link
            href={`/products?category=${category.slug}`}
            className="group relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-background/80 shadow-sm hover:shadow-xl transition-all duration-300 h-full block hover:-translate-y-1 p-6"
          >
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <category.icon className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-base group-hover:text-amber-600 transition-colors">
                {category.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {category.description}
              </p>
              <p className="text-xs text-amber-500 mt-2 font-medium group-hover:text-amber-400 transition-colors">
                Shop Now →
              </p>
            </div>
          </Link>
        </AnimatedSection>
      ))}
    </div>
  );
}

function TestimonialsSection() {
  const lightingTestimonials = [
    {
      name: "Samuel Kamau",
      role: "Hardware Store Owner, Kitengela",
      content:
        "Blessed Two Electronics has the best solar lights in Nairobi. Their products are durable and customer service is exceptional. My business has grown 40% since partnering with them.",
      rating: 5,
    },
    {
      name: "Grace Wanjiku",
      role: "Homeowner, Ruiru",
      content:
        "The LED bulbs I bought have cut my electricity bill by 30%. The quality is unmatched and they deliver all over Nairobi same day!",
      rating: 5,
    },
    {
      name: "David Ochieng",
      role: "Security Company Director",
      content:
        "Their security camera lights are top-notch. Bright, reliable, and perfect for commercial properties. Best lighting supplier in Duruma Road!",
      rating: 5,
    },
    {
      name: "Mercy Atieno",
      role: "Restaurant Owner, Westlands",
      content:
        "The decorative lights transformed my restaurant's ambiance. Customers love it! Professional installation and fair prices.",
      rating: 5,
    },
  ];

  return (
    <div className="relative overflow-hidden py-12 sm:py-4 md:py-8">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/20 to-yellow-50/20 dark:from-amber-900/10 dark:to-yellow-900/10" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <AnimatedSection animation="fadeUp" once>
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30">
              <Quote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                What Our Customers Say
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              Lighting Up Nairobi with Excellence
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Trusted by homeowners and businesses across Kenya
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {lightingTestimonials.map((testimonial, index) => (
            <AnimatedSection
              key={index}
              animation="fadeUp"
              delay={0.2 * index}
              once
              className="h-full"
              spacing="none"
            >
              <div className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 sm:p-6 h-full border dark:border-gray-800 hover:-translate-y-1 bg-gradient-to-br from-white to-amber-50/30 dark:from-gray-900 dark:to-amber-900/10">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <div className="relative mb-6">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-amber-100 dark:text-amber-900/30" />
                  <p className="leading-relaxed italic pl-4 text-gray-700 dark:text-gray-300">
                    "{testimonial.content}"
                  </p>
                </div>

                <div className="flex items-center gap-3 border-t pt-4 dark:border-amber-800/30">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center font-bold text-white">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Stats section */}
        <AnimatedSection animation="fade" delay={0.8} once className="mt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            {[
              { value: "2,000+", label: "Happy Customers", icon: Users },
              { value: "5,000+", label: "Products Sold", icon: Lightbulb },
              { value: "24/7", label: "Nairobi Delivery", icon: Truck },
              { value: "2-Year", label: "Warranty", icon: ShieldCheck },
            ].map((stat, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border dark:border-amber-800/30 bg-gradient-to-b from-white to-amber-50/30 dark:from-gray-900 dark:to-amber-900/10"
              >
                <div className="flex justify-center mb-2">
                  <stat.icon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}

function CouponSection({ coupons }: { coupons: Coupon[] }) {
  if (coupons.length === 0) return null;

  // Format coupon for display
  const formatCoupon = (coupon: Coupon) => {
    const discountText =
      coupon.discount_type === "percentage"
        ? `${coupon.discount_value}% OFF`
        : `${formatCurrency(coupon.discount_value, "KES")} OFF`;

    const minAmount =
      coupon.min_order_amount > 0
        ? `KES ${coupon.min_order_amount.toLocaleString()}`
        : "No minimum";

    // Calculate days until expiry
    const expiryDate = new Date(coupon.valid_until);
    const today = new Date();
    const daysLeft = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      ...coupon,
      displayDiscount: discountText,
      displayMinAmount: minAmount,
      daysLeft,
      isExpiringSoon: daysLeft <= 7,
      usageLeft: coupon.usage_limit
        ? coupon.usage_limit - (coupon.used_count || 0)
        : null,
    };
  };

  const formattedCoupons = coupons.map(formatCoupon);

  return (
    <CompactSection>
      <div className="container mx-auto px-4 sm:px-6">
        <AnimatedSection
          animation="fadeUp"
          spacing="none"
          once
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-1 shadow-2xl"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 animate-pulse">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-sm font-bold shadow-lg">
                      EXCLUSIVE OFFERS
                    </span>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">
                      Limited coupons available • First come, first served
                    </p>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  🎁 Grab These Exclusive Discounts!
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {formattedCoupons.slice(0, 2).map((coupon, index) => (
                    <div
                      key={coupon.id}
                      className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800/30 sm:p-5 p-2 rounded-xl border border-amber-200 dark:border-amber-800/30 hover:shadow-lg transition-shadow duration-300"
                    >
                      {/* Limited Stock Badge */}
                      {coupon.usageLeft && coupon.usageLeft <= 10 && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs animate-pulse">
                            {coupon.usageLeft} left!
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                            {coupon.code}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {coupon.description || coupon.displayDiscount}
                          </p>
                        </div>
                        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold px-2 sm:px-4 py-2 rounded-lg">
                          {coupon.displayDiscount}
                        </div>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          USE CODE AT CHECKOUT
                        </div>
                        <code className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400">
                          {coupon.code}
                        </code>
                        <div className="flex items-center justify-between mt-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span
                              className={
                                coupon.isExpiringSoon
                                  ? "text-red-500 font-bold"
                                  : ""
                              }
                            >
                              {coupon.daysLeft} days left
                            </span>
                          </div>
                          <CopyCouponBar
                            code={coupon.code}
                            minAmount={coupon.displayMinAmount}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="text-sm font-medium">
                    🚀 Hurry! These coupons are exclusive to Blessed Two
                    Electronics customers
                  </p>
                </div>
              </div>

              <div className="lg:w-1/3 flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800/20">
                <div className="text-center mb-6">
                  <div className="inline-block p-4 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 mb-4">
                    <Bolt className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Why Join Now?
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 text-left space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Get exclusive coupon codes not available elsewhere
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Early access to new lighting products</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Priority customer support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Free installation on orders above KES 10,000</span>
                    </li>
                  </ul>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold py-6 text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <Link href="/login">
                    <Users className="h-5 w-5 mr-2" />
                    Join Now & Save More!
                  </Link>
                </Button>
              </div>
            </div>

            {/* All Coupons Grid */}
            {formattedCoupons.length > 2 && (
              <div className="mt-8 pt-8 border-t border-amber-200 dark:border-amber-800/30">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                  More Amazing Offers
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formattedCoupons.slice(2).map((coupon) => (
                    <div
                      key={coupon.id}
                      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-bold text-gray-900 dark:text-white">
                            {coupon.displayDiscount}
                          </h5>
                          <p className="text-xs text-gray-500">
                            {coupon.description || "Special offer"}
                          </p>
                        </div>
                        {coupon.usageLeft && coupon.usageLeft <= 5 && (
                          <ShadBadge variant="destructive" className="text-xs">
                            {coupon.usageLeft} left
                          </ShadBadge>
                        )}
                      </div>

                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-3">
                        <code className="font-mono font-bold text-amber-600 dark:text-amber-400 text-lg">
                          {coupon.code}
                        </code>
                      </div>
                      <CopyCouponBar
                        code={coupon.code}
                        minAmount={coupon.displayMinAmount}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>
    </CompactSection>
  );
}

export default async function Home() {
  const data = await fetchFeatured();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900/20 flex items-center justify-center overflow-hidden">
        {/* Animated light beams */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-64 bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent"
              style={{
                top: `${20 + i * 15}%`,
                left: `${i * 20}%`,
                transform: `rotate(${i * 15}deg)`,
                animation: `beam 8s infinite ${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className="px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <div className="max-w-6xl mx-auto">
            {/* Location Badge */}
            <AnimatedSection
              animation="fade"
              delay={0.1}
              className="text-center mb-6"
              spacing="none"
              once
            >
              <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-lg">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Nairobi, Duruma Road • </span>
                <Phone className="w-4 h-4 text-amber-600" />
                <span>0727 833 691</span>
              </div>
            </AnimatedSection>

            {/* Main Headline */}
            <div className="mb-6 sm:mb-8">
              <AnimatedSection
                animation="fade"
                delay={0.2}
                className="text-center"
                spacing="normal"
                once
              >
                <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
                  <span className="block text-gray-900 dark:text-white">
                    Lighting Up
                  </span>
                  <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent animate-gradient">
                    Every Corner of Kenya
                  </span>
                </h1>
              </AnimatedSection>
            </div>

            {/* Deal of the Day Badge */}
            <AnimatedSection
              animation="fadeUp"
              delay={0.3}
              className="text-center mb-6"
              spacing="none"
              once
            >
              <Link
                href="/products?deal=true"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 hover:from-red-600 hover:via-orange-600 hover:to-amber-600 text-white font-bold py-3 px-3 sm:px-6 rounded-full sm:text-xl shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 animate-pulse"
              >
                <div className="flex items-center gap-2">
                  <Bolt className="w-6 h-6" />
                  <span className="relative">
                    🔥 DEAL OF THE DAY: 30% OFF!
                    <span className="absolute -top-2 -right-6 text-xs font-normal bg-white text-red-600 px-2 py-0.5 rounded-full animate-bounce">
                      Ends Today
                    </span>
                  </span>
                  <Bolt className="w-6 h-6" />
                </div>
              </Link>
            </AnimatedSection>

            {/* Subheading */}
            <AnimatedSection
              animation="fadeUp"
              delay={0.4}
              className="text-center"
              spacing="none"
              once
            >
              <div className="mb-8 sm:mb-12">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Kenya's Leading Lighting Solutions Provider
                </p>
                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  From energy-saving LED bulbs to advanced solar systems -
                  illuminating homes and businesses across Nairobi since 2010
                </p>
              </div>
            </AnimatedSection>

            {/* Feature badges */}
            <AnimatedSection
              animation="fadeUp"
              delay={0.6}
              className="mb-8 sm:mb-12"
              spacing="none"
              once
            >
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {[
                  { text: "Same-Day Delivery", icon: Truck },
                  { text: "2-Year Warranty", icon: ShieldCheck },
                  { text: "Free Installation", icon: Award },
                  { text: "M-Pesa Accepted", icon: CreditCard },
                  { text: "Expert Advice", icon: Headphones },
                ].map((badge, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-lg hover:shadow-xl transition-shadow duration-300 border dark:border-gray-700"
                  >
                    <badge.icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    {badge.text}
                  </div>
                ))}
              </div>
            </AnimatedSection>

            {/* CTA Buttons */}
            <AnimatedSection
              animation="fadeUp"
              delay={0.8}
              className="mb-8"
              spacing="none"
              once
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold py-6 px-8 rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-amber-500/40 w-full sm:w-auto"
                >
                  <Link
                    href="/products"
                    className="flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    SHOP ALL LIGHTS
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="font-bold py-6 px-8 rounded-xl text-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    GET EXPERT ADVICE
                  </Link>
                </Button>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-amber-600/70" />
        </div>
      </section>

      {/* Categories */}
      <CompactSection>
        <div className="container mx-auto px-4 sm:px-6">
          <AnimatedSection animation="fadeUp" spacing="none" once>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-12">
              Complete Lighting Solutions
            </h2>
            <p className="sm:text-lg text-center text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-12">
              Everything you need to light up your home or business - from
              energy-saving bulbs to advanced solar systems
            </p>
          </AnimatedSection>
          <CategoriesGrid categories={lightingCategories} />
        </div>
      </CompactSection>

      {/* Coupons Section */}
      <CouponSection coupons={data.coupons} />

      {/* Featured Products */}
      <CompactSection>
        <div className="container mx-auto px-4 sm:px-6">
          <AnimatedSection animation="fadeUp" spacing="none" once>
            <div className="text-center mb-8 sm:mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-20 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-700 dark:text-amber-300 font-medium">
                  <Bolt className="w-4 h-4" />
                  TOP PICKS THIS WEEK
                </span>
                <div className="h-px w-20 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                Best Selling Lighting Products
              </h2>
              <p className="text-muted-foreground sm:text-lg max-w-2xl mx-auto">
                Quality lighting solutions loved by thousands of Kenyan homes
                and businesses
              </p>
            </div>
          </AnimatedSection>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            }
          >
            <FeaturedProductsGrid products={data.featuredProducts} />
          </Suspense>

          {/* Deal of the day section */}
          {data.featuredProducts.some((p) => p.isDealOfTheDay) && (
            <DealOfTheDaySection products={data.featuredProducts} />
          )}
        </div>
      </CompactSection>

      {/* Why Choose Us */}
      <CompactSection>
        <div className="container mx-auto px-4 sm:px-6">
          <AnimatedSection animation="fadeUp" spacing="none" once>
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                Why Choose Blessed Two Electronics
              </h2>
              <p className="text-muted-foreground sm:text-lg max-w-2xl mx-auto">
                The trusted lighting partner for Nairobi homes and businesses
                since 2010
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {shopFeatures.map((feature, index) => (
              <AnimatedSection
                key={index}
                animation="fadeUp"
                delay={0.1 * index}
                once
                className="h-full"
                spacing="none"
              >
                <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 h-full hover:-translate-y-1 border dark:border-gray-800">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </CompactSection>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Final CTA */}
      <CompactSection className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <AnimatedSection animation="fade" once>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Need Lighting Solutions?
              </h2>
              <p className="text-lg sm:text-xl mb-6 opacity-95">
                Visit our store on Duruma Road or chat with our lighting experts
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <h4 className="font-bold mb-1">Visit Our Store</h4>
                  <p className="text-sm opacity-90">Duruma Road, Nairobi</p>
                  <p className="text-sm opacity-80">Mon-Sat: 8AM-8PM</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Phone className="w-8 h-8 mx-auto mb-2" />
                  <h4 className="font-bold mb-1">Call Us</h4>
                  <p className="text-sm opacity-90">0727 833 691</p>
                  <p className="text-sm opacity-80">24/7 Support</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Mail className="w-8 h-8 mx-auto mb-2" />
                  <h4 className="font-bold mb-1">Email Us</h4>
                  <p className="text-sm opacity-90">info@blessedtwo.com</p>
                  <p className="text-sm opacity-80">Quick Response</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-amber-700 hover:bg-white/90 font-bold px-10 py-6 text-lg rounded-xl hover:scale-105 transition-transform duration-300"
                >
                  <Link href="/products">Shop All Products →</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white text-black hover:bg-white/20 font-bold px-10 py-6 text-lg rounded-xl hover:scale-105 transition-transform duration-300"
                >
                  <Link href="/contact">Get Free Consultation</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm opacity-80">
                Free delivery in Nairobi • 2-year warranty • Professional
                installation • M-Pesa accepted
              </p>
            </div>
          </AnimatedSection>
        </div>
      </CompactSection>
    </div>
  );
}
