// app/products/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Product } from "@/types/store";
import { supabaseAdmin } from "@/lib/supabase/admin";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.blessedtwo.com";

// --- Single, shared data fetch function ---
async function fetchProductData(slug: string) {
  try {
    // Fetch product directly from Supabase
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select(`*`)
      .eq("slug", slug)
      .single();

    if (error || !product) {
      console.error("Error fetching product:", error);
      return { product: null, relatedProducts: [] };
    }

    // Fetch related products in same category
    const { data: relatedProducts } = await supabaseAdmin
      .from("products")
      .select(
        `
        id,
        title,
        name,
        price,
        originalPrice,
        currency,
        images,
        category,
        slug,
        featured,
        isDealOfTheDay,
        rating,
        reviewsCount,
        stock
      `
      )
      .eq("category", product.category)
      .neq("id", product.id)
      .limit(4)
      .order("created_at", { ascending: false });

    return {
      product: product as Product,
      relatedProducts: (relatedProducts || []) as Product[],
    };
  } catch (error) {
    console.error("Error in fetchProductData:", error);
    return { product: null, relatedProducts: [] };
  }
}

// --- Generate static params ---
export async function generateStaticParams() {
  try {
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("slug")
      .limit(100);

    return (products || []).map((product) => ({
      slug: product.slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// Cache the product data for the current request
// This ensures generateMetadata and the page component share the same data
import { cache } from "react";
import ProductDetailPage from "@/components/ProductPage";

const getCachedProductData = cache(fetchProductData);

// --- Dynamic SEO per product ---
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { product } = await getCachedProductData(slug);

    if (!product) {
      return {
        title: "Product Not Found | Blessed Two Electronics",
        description: "This lighting product is missing or has been removed.",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const url = `${SITE_URL}/products/${slug}`;
    const image = product.images?.[0] || "/images/lighting-placeholder.jpg";

    return {
      title: `${product.title} | ${
        product.name || "Lighting Product"
      } | Blessed Two Electronics`,
      description:
        product.description?.slice(0, 160) ||
        `Premium ${product.category} lighting solution from Blessed Two Electronics. Free Nairobi delivery. 2-Year warranty.`,
      keywords: [
        product.title,
        product.category,
        "LED lights",
        "solar lights",
        "Nairobi",
        "Blessed Two Electronics",
        "lighting solutions",
        ...(product.tags || []),
      ].join(", "),
      openGraph: {
        title: product.title,
        description:
          product.description?.slice(0, 200) ||
          `Premium ${product.category} from Blessed Two Electronics`,
        url,
        type: "website",
        siteName: "Blessed Two Electronics",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: product.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description:
          product.description?.slice(0, 200) ||
          `Check out this ${product.category} from Blessed Two Electronics`,
        images: [image],
      },
      alternates: {
        canonical: url,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    };
  } catch {
    return {
      title: "Lighting Products | Blessed Two Electronics",
      description:
        "Premium lighting solutions in Nairobi. LED bulbs, solar lights, security lighting with 2-year warranty.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

// Revalidation settings
export const revalidate = 3600; // Revalidate every hour
export const dynamicParams = true;

// --- Main page component ---
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // This will use the cached data from generateMetadata
  const { product, relatedProducts } = await getCachedProductData(slug);

  if (!product) {
    notFound();
  }

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      product.description?.slice(0, 200) || "Premium lighting solution",
    image: product.images?.[0] || "",
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: "Blessed Two Electronics",
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${slug}`,
      priceCurrency: product.currency || "KES",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    aggregateRating: product.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviewsCount || 0,
          bestRating: "5",
          worstRating: "1",
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* No suspense needed since we already have the data */}
      <ProductDetailPage product={product} relatedProducts={relatedProducts} />
    </>
  );
}
