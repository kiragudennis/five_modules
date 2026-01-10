// app/products/[id]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductsPage from "@/components/ProductPage";
import { Product } from "@/types/store";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://shop.worldsamma.org";

// --- Fetch product directly from your API route ---
async function getProduct(slug: string) {
  const res = await fetch(`${SITE_URL}/api/products/${slug}`, {
    cache: "no-store", // ensures fresh data
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
}

// --- Dynamic SEO per product ---
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const data = await getProduct(slug);
    const product: Product | null = data?.product ?? null;

    if (!product) {
      return {
        title: "Product Not Found | Samma",
        description: "This product is missing or has been removed.",
      };
    }

    const url = `${SITE_URL}/products/${slug}`;
    const image = product.images?.length
      ? product.images[0]
      : "/covers/cover-1.jpg";

    return {
      title: `${product.title} | ${product.name}`,
      description:
        product.description?.slice(0, 160) || "View product details.",
      openGraph: {
        title: product.title,
        description: product.description || "",
        url,
        type: "website",
        siteName: "Samma Store",
        images: [{ url: image, width: 1200, height: 630, alt: product.title }],
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description: product.description || "",
        images: [image],
      },
      alternates: { canonical: url },
    };
  } catch {
    return {
      title: "Product | Samma Store",
      description: "Explore products at Samma Store.",
    };
  }
}

// --- Page component ---
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProduct(slug);
  const product: Product | null = data?.product ?? null;
  const relatedProducts: Product[] = data?.relatedProducts || [];

  if (!product) notFound();

  return <ProductsPage product={product} relatedProducts={relatedProducts} />;
}
