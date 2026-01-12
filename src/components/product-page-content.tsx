// src/components/product-page-content.tsx
"use client";

import ProductsPage from "@/components/ProductPage";
import { Product } from "@/types/store";

export default function ProductPageContentInner({
  product,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  return <ProductsPage product={product} relatedProducts={relatedProducts} />;
}
