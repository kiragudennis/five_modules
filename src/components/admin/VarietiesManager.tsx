// components/admin/VarietiesManager.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Copy, Package, X } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { Variaty } from "@/types/store";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import {
  formatTypeName,
  formatValue,
  getPlaceholderForType,
  getUnitHint,
  getValueExample,
  varietyOptions,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface VarietiesManagerProps {
  disabled?: boolean;
  productId?: string;
  productSku?: string;
  variaties: Variaty[];
  onVarietiesChange: (variaties: Variaty[]) => void;
}

export function VarietiesManager({
  disabled,
  productId,
  productSku,
  variaties,
  onVarietiesChange,
}: VarietiesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingVariety, setEditingVariety] = useState<Variaty | null>(null);
  const { supabase } = useAuth();

  const handleAddVariety = (newVariety: Omit<Variaty, "id" | "product_id">) => {
    const varietyWithId = {
      ...newVariety,
      id: crypto.randomUUID(),
      product_id: productId || "",
    };
    onVarietiesChange([...variaties, varietyWithId]);
    setShowForm(false);
  };

  const handleUpdateVariety = (updatedVariety: Variaty) => {
    const updatedVariaties = variaties.map((v) =>
      v.id === updatedVariety.id ? updatedVariety : v,
    );
    onVarietiesChange(updatedVariaties);
    setShowForm(false);
    setEditingVariety(null);
  };

  const handleDeleteVariety = async (varietyId: string) => {
    if (productId && varietyId) {
      const { error } = await supabase
        .from("product_varieties")
        .delete()
        .eq("id", varietyId);

      if (error) {
        toast.error("Failed to delete variety");
        return;
      }
    }

    onVarietiesChange(variaties.filter((v) => v.id !== varietyId));
    toast.success("Variety deleted");
  };

  const handleDuplicate = (variety: Variaty) => {
    const duplicatedVariety = {
      ...variety,
      id: crypto.randomUUID(),
      sku: `${variety.sku}-COPY`,
      is_default: false,
    };
    onVarietiesChange([...variaties, duplicatedVariety]);
  };

  const setAsDefault = (index: number) => {
    const updatedVariaties = variaties.map((v, i) => ({
      ...v,
      is_default: i === index,
    }));
    onVarietiesChange(updatedVariaties);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Product Varieties</h4>
          <p className="text-sm text-muted-foreground">
            {variaties.length} variation(s) available
          </p>
        </div>
        <Button
          size="sm"
          disabled={disabled}
          type="button"
          onClick={() => {
            setEditingVariety(null);
            setShowForm(!showForm);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? "Cancel" : "Add Variety"}
        </Button>
      </div>

      {/* Variety Form - Inline with no form tag */}
      {showForm && (
        <div className="border rounded-lg p-6 bg-muted/30 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-medium">
              {editingVariety ? "Edit Variety" : "Add New Variety"}
            </h5>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowForm(false);
                setEditingVariety(null);
              }}
              type="button"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <VarietyFormContent
            key={editingVariety?.id || "new"}
            initialData={editingVariety}
            productSku={productSku}
            onSave={editingVariety ? handleUpdateVariety : handleAddVariety}
            onCancel={() => {
              setShowForm(false);
              setEditingVariety(null);
            }}
          />
        </div>
      )}

      {/* Varieties Table */}
      {variaties.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variaties.map((variety, index) => (
                <TableRow key={variety.id}>
                  <TableCell className="font-medium">{variety.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {variety.sku}
                    </code>
                  </TableCell>
                  <TableCell>KES {variety.price.toLocaleString()}</TableCell>
                  <TableCell>
                    {variety.images && variety.images.length > 0 ? (
                      <div className="flex -space-x-2">
                        {variety.images.slice(0, 3).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                        {variety.images.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-white">
                            +{variety.images.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={variety.stock > 0 ? "default" : "destructive"}
                    >
                      {variety.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {variety.variety_type && (
                        <Badge variant="outline">{variety.variety_type}</Badge>
                      )}
                      {variety.variant_value && (
                        <Badge variant="outline">{variety.variant_value}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {variety.is_default ? (
                      <Badge className="bg-green-500">Default</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAsDefault(index)}
                        disabled={disabled}
                        type="button"
                      >
                        Set as Default
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingVariety(variety);
                          setShowForm(true);
                        }}
                        disabled={disabled}
                        type="button"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(variety)}
                        disabled={disabled}
                        type="button"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          variety.id && handleDeleteVariety(variety.id)
                        }
                        disabled={disabled}
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No varieties added yet. Click "Add Variety" to create product
            variations.
          </p>
        </div>
      )}
    </div>
  );
}

// This is now a div-based form (no <form> tag)
interface VarietyFormContentProps {
  initialData?: Variaty | null;
  productSku?: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function VarietyFormContent({
  initialData,
  productSku,
  onSave,
  onCancel,
}: VarietyFormContentProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(
    initialData?.sku || productSku
      ? `${productSku}-${initialData?.variant_value || "VAR"}`
      : "",
  );
  const [price, setPrice] = useState(initialData?.price || 0);
  const [stock, setStock] = useState(initialData?.stock || 0);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [isDefault, setIsDefault] = useState(initialData?.is_default || false);
  const [varietyType, setVarietyType] = useState(
    initialData?.variety_type || "wattage",
  );
  const [variantValue, setVariantValue] = useState(
    initialData?.variant_value || "",
  );

  const isEditing = !!initialData;

  const handleImageChange = (newImages: string[]) => {
    setImages(newImages);
  };

  const handleSave = () => {
    // Basic validation
    if (!name || !sku || !price || !stock) {
      toast.error("Please fill in all required fields");
      return;
    }

    const varietyData = {
      ...(isEditing && { id: initialData.id }),
      name,
      sku,
      price,
      stock,
      images,
      is_default: isDefault,
      variant_value: variantValue,
      variety_type: varietyType,
    };

    onSave(varietyData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Variety Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Variety Type <span className="text-red-500">*</span>
          </label>
          <Select value={varietyType} onValueChange={setVarietyType}>
            <SelectTrigger
              className={!varietyType ? "text-muted-foreground" : ""}
            >
              <SelectValue placeholder="Select variety type (e.g., Wattage)" />
            </SelectTrigger>
            <SelectContent>
              {varietyOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  <span className="capitalize">
                    {type.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose the type of variation (e.g., wattage, colorTemp, size)
          </p>
        </div>

        {/* Variant Value Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Variant Value <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              value={variantValue}
              onChange={(e) => setVariantValue(e.target.value)}
              placeholder={
                varietyType
                  ? getPlaceholderForType(varietyType)
                  : "Enter value (e.g., 50, Cool White, Large)"
              }
              className={cn(
                "font-mono",
                varietyType && "pr-16", // Make room for unit hint if needed
              )}
              required
            />
            {/* Show unit hint for certain types */}
            {varietyType && getUnitHint(varietyType) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {getUnitHint(varietyType)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {getValueExample(varietyType)}
          </p>
        </div>
      </div>

      {/* Preview of how it will appear */}
      {varietyType && variantValue && (
        <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
          <p className="text-sm font-medium mb-2">Preview:</p>
          <Badge variant="outline" className="border-amber-300">
            {formatTypeName(varietyType)}:{" "}
            {formatValue(varietyType, variantValue)}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            This will appear as a filter option and in the variety card
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Variety Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., 20W Cool White"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">SKU </label>
          <Input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Enter SKU"
            className="font-mono"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Price (KES)</label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            placeholder="0"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock</label>
          <Input
            type="number"
            value={stock}
            onChange={(e) => setStock(parseInt(e.target.value))}
            placeholder="0"
            required
          />
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Checkbox
            id="isDefault"
            checked={isDefault}
            onCheckedChange={(checked) => setIsDefault(checked as boolean)}
          />
          <label htmlFor="isDefault" className="text-sm">
            Set as default variety
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Variety Images</label>
        <ImageUpload
          value={images}
          onChange={handleImageChange}
          maxFiles={4}
          disabled={false}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave}>
          {isEditing ? "Update" : "Add"} Variety
        </Button>
      </div>
    </div>
  );
}
