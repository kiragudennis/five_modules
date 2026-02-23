// components/ProductVarieties.tsx
"use client";

import { useState, useEffect } from "react";
import { Variaty } from "@/types/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Package, Images } from "lucide-react";
import Image from "next/image";

interface ProductVarietiesProps {
  varieties: Variaty[];
  onVarietyChange: (variety: Variaty) => void;
  onVarietyImagesChange?: (images: string[]) => void;
  selectedVarietyId?: string;
}

// Allowed variety types from the database enum
const ALLOWED_VARIETY_TYPES = [
  "wattage",
  "colorTemp",
  "warranty",
  "batteryCapacity",
  "solarPanelWattage",
  "dimensions",
  "ipRating",
  "installationType",
  "referralPoints",
  "size",
  "type",
] as const;

type VarietyType = (typeof ALLOWED_VARIETY_TYPES)[number];

export function ProductVarieties({
  varieties,
  onVarietyChange,
  onVarietyImagesChange,
  selectedVarietyId,
}: ProductVarietiesProps) {
  const [selectedId, setSelectedId] = useState<string>(
    selectedVarietyId ||
      varieties.find((v) => v.is_default)?.id ||
      varieties[0]?.id ||
      "",
  );

  const selectedVariety = varieties.find((v) => v.id === selectedId);

  useEffect(() => {
    if (selectedVariety && onVarietyImagesChange && selectedVariety.images) {
      onVarietyImagesChange(selectedVariety.images);
    }
  }, [selectedVariety, onVarietyImagesChange]);

  if (!varieties.length) return null;

  const handleSelect = (variety: Variaty) => {
    if (variety.id) {
      setSelectedId(variety.id);
      onVarietyChange(variety);
    }
  };

  // Group varieties by variety_type
  const getVarietyGroups = () => {
    const groups = new Map<string, Set<string>>();

    varieties.forEach((variety) => {
      if (variety.variety_type && variety.variant_value) {
        if (!groups.has(variety.variety_type)) {
          groups.set(variety.variety_type, new Set());
        }
        groups.get(variety.variety_type)?.add(variety.variant_value);
      }
    });

    return groups;
  };

  // Get all unique variety types that have multiple values
  const getActiveVarietyTypes = (): string[] => {
    const groups = getVarietyGroups();
    return Array.from(groups.entries())
      .filter(([_, values]) => values.size > 1)
      .map(([type]) => type);
  };

  // Get all values for a specific variety type
  const getValuesForType = (type: string): string[] => {
    const values = new Set<string>();
    varieties.forEach((variety) => {
      if (variety.variety_type === type && variety.variant_value) {
        values.add(variety.variant_value);
      }
    });
    return Array.from(values);
  };

  // Check if a combination is available
  const isCombinationAvailable = (
    type: string,
    value: string,
    currentSelection: Variaty,
  ): boolean => {
    // Build filters based on current selection
    const filters: Record<string, string> = {};

    // Add all current selection filters except the one we're checking
    varieties.forEach((variety) => {
      if (variety.id === currentSelection.id) {
        if (variety.variety_type && variety.variant_value) {
          filters[variety.variety_type] = variety.variant_value;
        }
      }
    });

    // Override with the new selection
    filters[type] = value;

    // Find any variety that matches all filters
    return varieties.some((variety) => {
      return Object.entries(filters).every(
        ([filterType, filterValue]) =>
          variety.variety_type === filterType &&
          variety.variant_value === filterValue,
      );
    });
  };

  // Find variety that matches selected options
  const findMatchingVariety = (
    selectedType: string,
    selectedValue: string,
  ): Variaty | undefined => {
    const filters: Record<string, string> = {};

    // Start with current selection
    if (selectedVariety?.variety_type && selectedVariety?.variant_value) {
      filters[selectedVariety.variety_type] = selectedVariety.variant_value;
    }

    // Override with the new selection
    filters[selectedType] = selectedValue;

    // Find a variety that matches all filters
    return varieties.find((variety) => {
      return Object.entries(filters).every(
        ([type, value]) =>
          variety.variety_type === type && variety.variant_value === value,
      );
    });
  };

  // Format the display name for variety types
  const formatTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      wattage: "Wattage",
      colorTemp: "Color Temperature",
      warranty: "Warranty",
      batteryCapacity: "Battery Capacity",
      solarPanelWattage: "Solar Panel Wattage",
      dimensions: "Dimensions",
      ipRating: "IP Rating",
      installationType: "Installation Type",
      referralPoints: "Referral Points",
      size: "Size",
      type: "Type",
    };

    return typeMap[type] || type.replace(/([A-Z])/g, " $1").trim();
  };

  // Format the display value
  const formatValue = (type: string, value: string): string => {
    switch (type) {
      case "wattage":
      case "solarPanelWattage":
        return value.includes("W") ? value : `${value}W`;
      case "batteryCapacity":
        return value.includes("Ah") ? value : `${value}Ah`;
      case "referralPoints":
        return value.includes("pts") ? value : `${value} pts`;
      case "price":
        return value.startsWith("KES") ? value : `KES ${value}`;
      default:
        return value;
    }
  };

  const activeTypes = getActiveVarietyTypes();

  return (
    <div className="space-y-6">
      {/* Variety Cards Grid */}
      <div>
        <label className="text-sm font-medium mb-2 block">Select Variety</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {varieties.map((variety) => {
            const isSelected = selectedId === variety.id;
            const hasImage = variety.images && variety.images.length > 0;

            return (
              <button
                key={variety.id}
                type="button"
                onClick={() => handleSelect(variety)}
                className={cn(
                  "relative group rounded-lg border-2 p-2 transition-all",
                  isSelected
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    : "border-gray-200 hover:border-amber-300 dark:border-gray-700",
                  variety.stock <= 0 && "opacity-50 cursor-not-allowed",
                )}
                disabled={variety.stock <= 0}
              >
                {/* Image */}
                <div className="aspect-square relative mb-2 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {hasImage ? (
                    <Image
                      src={variety.images[0]}
                      alt={variety.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}

                  {/* Selected Checkmark */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-amber-500 rounded-full p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}

                  {/* Multiple images indicator */}
                  {variety.images && variety.images.length > 1 && (
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">
                      <Images className="h-2 w-2 inline mr-1" />
                      {variety.images.length}
                    </div>
                  )}
                </div>

                {/* Variety Info */}
                <div className="text-center">
                  <p className="text-sm font-medium truncate">{variety.name}</p>
                  <p className="text-xs text-amber-600 font-bold">
                    KES {variety.price.toLocaleString()}
                  </p>
                  <Badge
                    variant={variety.stock > 0 ? "outline" : "destructive"}
                    className="mt-1 text-[10px] px-1 py-0"
                  >
                    {variety.stock > 0
                      ? `${variety.stock} left`
                      : "Out of stock"}
                  </Badge>

                  {/* Show variety type and value in card */}
                  {variety.variety_type && variety.variant_value && (
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      <span className="block">
                        {formatTypeName(variety.variety_type)}:{" "}
                        {formatValue(
                          variety.variety_type,
                          variety.variant_value,
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Filter Buttons for each variety type */}
      {activeTypes.map((type) => {
        const values = getValuesForType(type);

        return (
          <div key={type}>
            <label className="text-sm font-medium mb-2 block">
              {formatTypeName(type)}
            </label>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                if (!selectedVariety) return null;

                const isAvailable = isCombinationAvailable(
                  type,
                  value,
                  selectedVariety,
                );
                const isSelected =
                  selectedVariety.variety_type === type &&
                  selectedVariety.variant_value === value;
                const displayValue = formatValue(type, value);

                return (
                  <Button
                    key={value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "min-w-[60px]",
                      isSelected && "bg-amber-600 hover:bg-amber-700",
                      !isAvailable && "opacity-50 cursor-not-allowed",
                    )}
                    disabled={!isAvailable}
                    onClick={() => {
                      const variety = findMatchingVariety(type, value);
                      if (variety) handleSelect(variety);
                    }}
                  >
                    {displayValue}
                    {isSelected && <Check className="ml-1 h-3 w-3" />}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected Variety Details */}
      {selectedVariety && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-4">
            {/* Small preview of selected variety image */}
            {selectedVariety.images && selectedVariety.images.length > 0 && (
              <div className="w-16 h-16 relative rounded-md overflow-hidden border-2 border-amber-300 flex-shrink-0">
                <Image
                  src={selectedVariety.images[0]}
                  alt={selectedVariety.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                {selectedVariety.images.length > 1 && (
                  <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] px-1 rounded-tl">
                    +{selectedVariety.images.length - 1}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-lg">{selectedVariety.name}</p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {selectedVariety.sku}
                  </p>
                </div>
                <Badge
                  variant={
                    selectedVariety.stock > 0 ? "default" : "destructive"
                  }
                  className="text-sm"
                >
                  {selectedVariety.stock > 0
                    ? `${selectedVariety.stock} in stock`
                    : "Out of stock"}
                </Badge>
              </div>

              {/* Dynamic badges for variety type and value */}
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedVariety.variety_type &&
                  selectedVariety.variant_value && (
                    <Badge variant="outline" className="border-amber-300">
                      {formatTypeName(selectedVariety.variety_type)}:{" "}
                      {formatValue(
                        selectedVariety.variety_type,
                        selectedVariety.variant_value,
                      )}
                    </Badge>
                  )}

                {/* Show additional attributes from the attributes object */}
                {Object.entries(selectedVariety.attributes).map(
                  ([key, value]) => (
                    <Badge
                      key={key}
                      variant="outline"
                      className="border-amber-300"
                    >
                      {formatTypeName(key)}: {String(value)}
                    </Badge>
                  ),
                )}

                {selectedVariety.images &&
                  selectedVariety.images.length > 1 && (
                    <Badge
                      variant="outline"
                      className="border-blue-300 text-blue-600"
                    >
                      <Images className="h-3 w-3 mr-1" />
                      {selectedVariety.images.length} images
                    </Badge>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
