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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Copy, Package, AlertCircle } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Variaty, VarietyAttributes } from "@/types/store";
import { Description } from "@radix-ui/react-dialog";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";

interface VarietiesManagerProps {
  disabled?: boolean;
  productId?: string; // For new products, this might be undefined until saved
  variaties: Variaty[];
  onVarietiesChange: (variaties: Variaty[]) => void; // Callback to update parent
}

const wattageOptions = [5, 10, 20, 30, 50, 100, 150, 200];
const colorTempOptions = [
  "2700K (Warm White)",
  "3000K (Soft White)",
  "4000K (Cool White)",
  "5000K (Daylight)",
  "6500K (Cool Daylight)",
  "RGB (Multi Color)",
];

const generateVarietySku = (baseSku: string, attributes: VarietyAttributes) => {
  if (!baseSku) return "";
  const suffix = Object.values(attributes)
    .filter(Boolean)
    .map((val) => val?.toString().replace(/[^a-zA-Z0-9]/g, ""))
    .join("-");
  return `${baseSku}-${suffix}`.toUpperCase();
};

const generateVarietyName = (attributes: any) => {
  const parts = [];
  if (attributes.wattage) parts.push(`${attributes.wattage}W`);
  if (attributes.colorTemp) {
    const tempMatch = attributes.colorTemp.match(/(\d+K)/);
    if (tempMatch) parts.push(tempMatch[0]);
  }
  return parts.join(" - ") || "New Variety";
};

export function VarietiesManager({
  disabled,
  productId,
  variaties,
  onVarietiesChange,
}: VarietiesManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariety, setEditingVariety] = useState<Variaty | null>(null);
  const { supabase } = useAuth();

  const handleAddVariety = (newVariety: Omit<Variaty, "id" | "product_id">) => {
    const varietyWithId = {
      ...newVariety,
      id: crypto.randomUUID(), // Temporary ID for UI
      product_id: productId || "",
    };
    onVarietiesChange([...variaties, varietyWithId]);
    setIsDialogOpen(false);
  };

  const handleUpdateVariety = (updatedVariety: Variaty) => {
    const updatedVariaties = variaties.map((v) =>
      v.id === updatedVariety.id ? updatedVariety : v,
    );
    onVarietiesChange(updatedVariaties);
    setIsDialogOpen(false);
    setEditingVariety(null);
  };

  const handleDeleteVariety = async (varietyId: string) => {
    if (productId && varietyId) {
      // If it's an existing variety in DB, delete it
      const { error } = await supabase
        .from("product_varieties")
        .delete()
        .eq("id", varietyId);

      if (error) {
        toast.error("Failed to delete variety");
        return;
      }
    }

    // Remove from local state
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

  if (variaties.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Product Varieties</h4>
            <p className="text-sm text-muted-foreground">
              Add different versions of this product
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={disabled} type="button">
                <Plus className="w-4 h-4 mr-2" />
                Add Variety
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Variety</DialogTitle>
                <Description className="text-sm text-muted-foreground">
                  Create a new variety for this product.
                </Description>
              </DialogHeader>
              <VarietyForm
                onSave={handleAddVariety}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No varieties added yet. Click "Add Variety" to create product
            variations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Product Varieties</h4>
          <p className="text-sm text-muted-foreground">
            {variaties.length} variation(s) available
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={disabled} type="button">
              <Plus className="w-4 h-4 mr-2" />
              Add Variety
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVariety ? "Edit Variety" : "Add New Variety"}
              </DialogTitle>
              <Description className="text-sm text-muted-foreground">
                {editingVariety
                  ? "Update the details of this variety."
                  : "Create a new variety for this product."}
              </Description>
            </DialogHeader>
            <VarietyForm
              initialData={editingVariety}
              onSave={editingVariety ? handleUpdateVariety : handleAddVariety}
              onCancel={() => {
                setEditingVariety(null);
                setIsDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Images</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Attributes</TableHead>
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
                    {variety.attributes.wattage && (
                      <Badge variant="outline">
                        {variety.attributes.wattage}W
                      </Badge>
                    )}
                    {variety.attributes.colorTemp && (
                      <Badge variant="outline">
                        {variety.attributes.colorTemp}
                      </Badge>
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
                        setIsDialogOpen(true);
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
    </div>
  );
}

interface VarietyFormProps {
  initialData?: Variaty | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function VarietyForm({ initialData, onSave, onCancel }: VarietyFormProps) {
  const [attributes, setAttributes] = useState<VarietyAttributes>(
    initialData?.attributes || {
      wattage: "",
      colorTemp: "",
    },
  );
  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [price, setPrice] = useState(initialData?.price || 0);
  const [stock, setStock] = useState(initialData?.stock || 0);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [isDefault, setIsDefault] = useState(initialData?.is_default || false);

  const isEditing = !!initialData;

  // Log when images change
  console.log("VarietyForm - current images:", images);
  console.log("VarietyForm - initialData images:", initialData?.images);

  const handleImageChange = (newImages: string[]) => {
    console.log("handleImageChange called with:", newImages);
    setImages(newImages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const varietyData = {
      ...(isEditing && { id: initialData.id }),
      name,
      sku,
      price,
      stock,
      images, // This should now contain the updated images
      attributes,
      is_default: isDefault,
    };

    console.log("Submitting variety with images:", varietyData);
    onSave(varietyData);
  };

  // Auto-generate name from attributes
  useEffect(() => {
    const parts = [];
    if (attributes.wattage) parts.push(`${attributes.wattage}W`);
    if (attributes.colorTemp) {
      const tempMatch = attributes.colorTemp.match(/(\d+K)/);
      if (tempMatch) parts.push(tempMatch[0]);
    }
    if (parts.length > 0 && !name) {
      setName(parts.join(" - "));
    }
  }, [attributes, name]);

  // Auto-generate SKU from attributes if needed
  useEffect(() => {
    if (!sku && attributes.wattage) {
      // Generate SKU logic here if needed
    }
  }, [attributes, sku]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Wattage</label>
          <Select
            value={attributes.wattage?.toString()}
            onValueChange={(value) =>
              setAttributes({ ...attributes, wattage: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select wattage" />
            </SelectTrigger>
            <SelectContent>
              {wattageOptions.map((w) => (
                <SelectItem key={w} value={w.toString()}>
                  {w}W
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Color Temperature</label>
          <Select
            value={attributes.colorTemp?.toString() || ""}
            onValueChange={(value) =>
              setAttributes({ ...attributes, colorTemp: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select color temp" />
            </SelectTrigger>
            <SelectContent>
              {colorTempOptions.map((temp) => (
                <SelectItem key={temp} value={temp}>
                  {temp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
          <label className="text-sm font-medium">SKU</label>
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

        {/* Debug display to verify images are being set */}
        {images.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">
              ✓ {images.length} image(s) uploaded and ready
            </p>
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Preview ${i + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border-2 border-green-300"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isEditing ? "Update" : "Add"} Variety</Button>
      </div>
    </form>
  );
}
