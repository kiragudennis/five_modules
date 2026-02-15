// components/admin/VarietiesManager.tsx
"use client";

import { useState, useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
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
import { VarietyAttributes } from "@/types/store";
import { Description } from "@radix-ui/react-dialog";
import { FormControl, FormField, FormItem } from "../ui/form";

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

export function VarietiesManager({ disabled }: VarietiesManagerProps) {
  const { control, watch, getValues } = useFormContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "varieties",
  });

  console.log("Current varieties in form state:", getValues("varieties"));

  const hasVarieties = watch("has_varieties");
  const baseSku = watch("sku") || "";
  const basePrice = watch("price") || 0;
  const baseStock = watch("stock") || 0;

  // Auto-generate initial varieties from base product if none exist
  useEffect(() => {
    if (hasVarieties && fields.length === 0 && baseSku && basePrice) {
      // Create a default variety based on main product attributes
      const mainAttributes: any = {};
      if (watch("wattage")) mainAttributes.wattage = watch("wattage");
      if (watch("colorTemperature"))
        mainAttributes.colorTemp = watch("colorTemperature");

      if (Object.keys(mainAttributes).length > 0) {
        const defaultVariety = {
          name: generateVarietyName(mainAttributes),
          sku: generateVarietySku(baseSku, mainAttributes),
          price: basePrice,
          stock: baseStock,
          images: [],
          attributes: mainAttributes,
          is_default: true,
        };
        append(defaultVariety);
      }
    }
  }, [
    hasVarieties,
    baseSku,
    basePrice,
    baseStock,
    fields.length,
    append,
    watch,
  ]);

  const handleAddVariety = (data: any) => {
    console.log("handleAddVariety received:", data);

    // Ensure images is always an array
    const varietyData = {
      ...data,
      images: Array.isArray(data.images) ? data.images : [],
    };

    console.log("Processed variety data:", varietyData);

    if (editingIndex !== null) {
      update(editingIndex, varietyData);
      setEditingIndex(null);
    } else {
      append(varietyData);
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
            <Button size="sm" disabled={disabled} type="button">
              <Plus className="w-4 h-4 mr-2" />
              Add Variety
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? "Edit Variety" : "Add New Variety"}
              </DialogTitle>
              <Description className="text-sm text-muted-foreground">
                {editingIndex !== null
                  ? "Update the details of this variety. Changes will reflect on the product page."
                  : "Create a new variety for this product. You can specify different attributes, price, stock, and images."}
              </Description>
            </DialogHeader>
            <VarietyForm
              onSubmit={handleAddVariety}
              initialData={
                editingIndex !== null ? fields[editingIndex] : undefined
              }
              baseSku={baseSku}
              basePrice={basePrice}
              baseStock={baseStock}
              onCancel={() => {
                setEditingIndex(null);
                setIsDialogOpen(false);
              }}
              index={editingIndex !== null ? editingIndex : -1}
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
                <TableHead>Images</TableHead>
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
                    {field.images && field.images.length > 0 ? (
                      <div className="flex -space-x-2">
                        {field.images
                          .slice(0, 3)
                          .map((img: string, i: number) => (
                            <img
                              key={i}
                              src={img}
                              alt=""
                              className="w-8 h-8 rounded-full border-2 border-white object-cover"
                            />
                          ))}
                        {field.images.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-white">
                            +{field.images.length - 3}
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
                          setEditingIndex(index);
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
                        onClick={() => handleDuplicate(index)}
                        disabled={disabled}
                        type="button"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
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
      )}
    </div>
  );
}

interface VarietyFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  baseSku: string;
  basePrice: number;
  baseStock: number;
  onCancel: () => void;
  index: number;
}

function VarietyForm({
  onSubmit,
  initialData,
  baseSku,
  basePrice,
  baseStock,
  onCancel,
  index,
}: VarietyFormProps) {
  const [attributes, setAttributes] = useState(
    initialData?.attributes || {
      wattage: "",
      colorTemp: "",
    },
  );
  const { watch, setValue } = useFormContext();
  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [price, setPrice] = useState(initialData?.price || basePrice);
  const [stock, setStock] = useState(initialData?.stock || baseStock);
  const [newVarietyImages, setNewVarietyImages] = useState<string[]>([]);
  const [isDefault, setIsDefault] = useState(initialData?.is_default || false);

  // Determine if this is a new variety (index === -1) or editing existing (index >= 0)
  const isNewVariety = index === -1;

  // For editing: get images from form state
  const existingImages = !isNewVariety
    ? watch(`varieties.${index}.images`) || []
    : [];

  // For display: use either existing images or new variety images
  const currentImages = isNewVariety ? newVarietyImages : existingImages;

  console.log("VarietyForm render - current images:", currentImages);

  const handleImageChange = (newImages: string[]) => {
    if (!isNewVariety) {
      // Editing existing variety - update form state
      setValue(`varieties.${index}.images`, newImages, {
        shouldValidate: true,
        shouldDirty: true,
      });
      console.log("Updated form state with images:", newImages);
    } else {
      // New variety - store in local state
      setNewVarietyImages(newImages);
      console.log("Updated new variety images:", newImages);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const varietyData = {
      name,
      sku,
      price,
      stock,
      images: currentImages, // Use the current images
      attributes,
      is_default: isDefault,
    };

    console.log("Submitting variety data with images:", varietyData);
    onSubmit(varietyData);
  };

  // Update SKU when baseSku changes (for new varieties)
  useEffect(() => {
    if (isNewVariety && baseSku && Object.values(attributes).some(Boolean)) {
      const generatedSku = generateVarietySku(baseSku, attributes);
      setSku(generatedSku);
    }
  }, [baseSku, attributes, isNewVariety]);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!baseSku && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Please set a base SKU for the product first before adding varieties.
          </AlertDescription>
        </Alert>
      )}

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
            disabled={!baseSku && !initialData}
          />
          <p className="text-xs text-muted-foreground">
            Base SKU: {baseSku || "Not set"}
          </p>
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
          <p className="text-xs text-muted-foreground">
            Base price: KES {basePrice}
          </p>
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
          value={currentImages}
          onChange={handleImageChange}
          maxFiles={4}
          disabled={false}
        />

        {/* Debug display */}
        {currentImages.length > 0 && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-700 mb-2">
              {currentImages.length} image(s) selected:
            </p>
            <div className="flex flex-wrap gap-2">
              {currentImages.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="w-16 h-16 object-cover rounded-lg border-2 border-blue-300"
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
        <Button type="submit" disabled={!baseSku && !initialData}>
          {initialData ? "Update" : "Add"} Variety
        </Button>
      </div>
    </form>
  );
}
