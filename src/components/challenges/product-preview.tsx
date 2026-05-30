import { AlertTriangle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";

export function ProductPreviewCard({
  productId,
  supabase,
}: {
  productId: string;
  supabase: any;
}) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(productId)) {
        setError("Invalid UUID format");
        setLoading(false);
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from("products")
          .select("id, name, title, price, image_url, category, stock")
          .eq("id", productId)
          .single();

        if (queryError) throw queryError;
        setProduct(data);
      } catch (err: any) {
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, supabase]);

  if (!productId) return null;

  return (
    <div className="p-3 rounded-lg border bg-muted/30">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading product...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {product && (
        <div className="flex items-center gap-3">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-12 h-12 rounded object-cover"
            />
          )}
          <div className="flex-1">
            <p className="font-medium text-sm">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              KSH {product.price?.toLocaleString()} • {product.category}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </Badge>
        </div>
      )}
    </div>
  );
}
