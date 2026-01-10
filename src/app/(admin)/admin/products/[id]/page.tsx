"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";
import { useAuth } from "@/lib/context/AuthContext";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const param = use(params);
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!param.id) return;
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", param.id)
          .single();

        if (data) {
          setProduct(data);
        } else {
          // Product not found, redirect to products page
          router.push("/admin/products");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        // Handle error, maybe redirect to products page
        router.push("/admin/products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [param.id, router]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The product you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="py-6 px-2">
      <h1 className="text-3xl font-bold mb-8">Edit Product</h1>
      <div>
        <ProductForm initialData={product} isEditing={true} />
      </div>
    </div>
  );
}
