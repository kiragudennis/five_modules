import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="px-2 py-6">
      <h1 className="text-3xl font-bold mb-8">Add New Product</h1>
      <div className="bg-background rounded-lg border p-2">
        <ProductForm />
      </div>
    </div>
  );
}
