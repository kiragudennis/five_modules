// components/admin/VarietiesManager.tsx
"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
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
import { Plus, Pencil, Trash2, Copy, Package } from "lucide-react";
import { ImageUpload } from "./ImageUpload";

interface VarietiesManagerProps {
  disabled?: boolean;
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

const generateVarietySku = (baseSku: string, attributes: any) => {
  if (!baseSku) return "";
  const suffix = Object.values(attributes)
    .filter(Boolean)
    .join("-")
    .replace(/[^a-zA-Z0-9-]/g, "");
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

export function VarietiesManager({ disabled }: VarietiesManagerProps) {
  const { control, watch, setValue } = useFormContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "varieties",
  });

  const hasVarieties = watch("has_varieties");
  const baseSku = watch("sku") || "";
  const basePrice = watch("price") || 0;

  const generateVarietySku = (baseSku: string, attributes: any) => {
    if (!baseSku) return "";
    const suffix = Object.values(attributes)
      .filter(Boolean)
      .join("-")
      .replace(/[^a-zA-Z0-9-]/g, "");
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

  const handleAddVariety = (data: any) => {
    if (editingIndex !== null) {
      update(editingIndex, data);
      setEditingIndex(null);
    } else {
      append(data);
    }
    setIsDialogOpen(false);
  };

  const handleDuplicate = (index: number) => {
    const variety = fields[index] as any;
    const newVariety = {
      ...variety,
      sku: `${variety.sku}-COPY`,
      is_default: false,
    };
    append(newVariety);
  };

  const setAsDefault = (index: number) => {
    fields.forEach((_, i) => {
      update(i, { ...fields[i], is_default: i === index });
    });
  };

  if (!hasVarieties) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Product Varieties</h4>
          <p className="text-sm text-muted-foreground">
            Add different versions of this product (different wattages, colors,
            etc.)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={disabled}>
              <Plus className="w-4 h-4 mr-2" />
              Add Variety
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? "Edit Variety" : "Add New Variety"}
              </DialogTitle>
            </DialogHeader>
            <VarietyForm
              onSubmit={handleAddVariety}
              initialData={
                editingIndex !== null ? fields[editingIndex] : undefined
              }
              baseSku={baseSku}
              basePrice={basePrice}
              onCancel={() => {
                setEditingIndex(null);
                setIsDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No varieties added yet. Click "Add Variety" to create product
            variations.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field: any, index) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">{field.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {field.sku}
                    </code>
                  </TableCell>
                  <TableCell>KES {field.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={field.stock > 0 ? "default" : "destructive"}
                    >
                      {field.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {field.attributes.wattage && (
                        <Badge variant="outline">
                          {field.attributes.wattage}W
                        </Badge>
                      )}
                      {field.attributes.colorTemp && (
                        <Badge variant="outline">
                          {field.attributes.colorTemp}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {field.is_default ? (
                      <Badge className="bg-green-500">Default</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAsDefault(index)}
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
                          setEditingIndex(index);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(index)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
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
      )}
    </div>
  );
}

interface VarietyFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  baseSku: string;
  basePrice: number;
  onCancel: () => void;
}

function VarietyForm({
  onSubmit,
  initialData,
  baseSku,
  basePrice,
  onCancel,
}: VarietyFormProps) {
  const [attributes, setAttributes] = useState(
    initialData?.attributes || {
      wattage: "",
      colorTemp: "",
    },
  );
  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [price, setPrice] = useState(initialData?.price || basePrice);
  const [stock, setStock] = useState(initialData?.stock || 0);
  const [images, setImages] = useState(initialData?.images || []);
  const [isDefault, setIsDefault] = useState(initialData?.is_default || false);

  const updateSkuFromAttributes = (newAttributes: typeof attributes) => {
    if (!baseSku) return;
    const generatedSku = generateVarietySku(baseSku, newAttributes);
    setSku(generatedSku);
  };

  const handleAttributeChange = (key: string, value: any) => {
    const newAttributes = { ...attributes, [key]: value };
    setAttributes(newAttributes);

    // Auto-generate name
    const newName = generateVarietyName(newAttributes);
    setName(newName);

    // Auto-generate SKU if base SKU exists
    if (baseSku) {
      updateSkuFromAttributes(newAttributes);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      sku,
      price,
      stock,
      images,
      attributes,
      is_default: isDefault,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Wattage</label>
          <Select
            value={attributes.wattage?.toString()}
            onValueChange={(value) =>
              handleAttributeChange("wattage", parseInt(value))
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
            value={attributes.colorTemp}
            onValueChange={(value) => handleAttributeChange("colorTemp", value)}
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
            placeholder="Auto-generated from attributes"
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
            placeholder={basePrice.toString()}
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
          onChange={setImages}
          maxFiles={4}
          disabled={false}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialData ? "Update" : "Add"} Variety</Button>
      </div>
    </form>
  );
}
