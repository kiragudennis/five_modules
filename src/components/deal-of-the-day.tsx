"use client";

import { Product } from "@/types/store";
import { useEffect, useState } from "react";
import { AnimatedSection, CompactSection } from "./ui/animated-section";
import { Bolt } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Button } from "./ui/button";
import Link from "next/link";

// In your landing page, after FeaturedProductsGrid but before Why Choose Us
export function DealOfTheDaySection({ products }: { products: Product[] }) {
  // Find the first deal of the day product
  const dealProduct = products.find((p) => p.isDealOfTheDay);

  if (!dealProduct) return null;

  const originalPrice = dealProduct.originalPrice || dealProduct.price;
  const discountPercentage = Math.round(
    ((originalPrice - dealProduct.price) / originalPrice) * 100
  );

  // Calculate time until midnight
  const calculateTimeLeft = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <CompactSection>
      <div className="container mx-auto px-4 sm:px-6">
        <AnimatedSection animation="fadeUp" delay={0.5} once className="mt-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-800/30 p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500">
                    <Bolt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      ⚡ Deal of the Day
                    </h3>
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      Limited stock - Ends midnight!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  {dealProduct.images?.[0] && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={dealProduct.images[0]}
                        alt={dealProduct.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                      {dealProduct.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {dealProduct.description?.substring(0, 120)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(dealProduct.price, dealProduct.currency)}
                  </div>
                  {dealProduct.originalPrice && (
                    <div className="text-lg text-gray-500 line-through">
                      {formatCurrency(
                        dealProduct.originalPrice,
                        dealProduct.currency
                      )}
                    </div>
                  )}
                  <div className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold rounded-full">
                    SAVE {discountPercentage}%
                  </div>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold px-8"
              >
                <Link
                  href={`/products/${dealProduct.slug}`}
                  className="flex items-center gap-2"
                >
                  <Bolt className="w-5 h-5" />
                  Grab This Deal
                </Link>
              </Button>
            </div>

            {/* Timer */}
            <div className="absolute top-4 right-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  OFFER ENDS IN
                </div>
                <div className="flex gap-2">
                  {[
                    { value: timeLeft.hours, label: "HRS" },
                    { value: timeLeft.minutes, label: "MIN" },
                    { value: timeLeft.seconds, label: "SEC" },
                  ].map((time, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-800 rounded-lg px-2 py-1 min-w-10"
                    >
                      <div className="font-bold text-gray-900 dark:text-white">
                        {time.value.toString().padStart(2, "0")}
                      </div>
                      <div className="text-xs text-gray-500">{time.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </CompactSection>
  );
}
