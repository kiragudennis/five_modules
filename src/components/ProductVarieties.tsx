// components/ProductVarieties.tsx
"use client";

import { useState } from "react";
import { Variaty } from "@/types/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Package, Images } from "lucide-react";
import Image from "next/image";

interface ProductVarietiesProps {
  varieties: Variaty[];
  onVarietyChange: (variety: Variaty) => void;
  onVarietyImagesChange?: (images: string[]) => void; // Changed to pass all images
  selectedVarietyId?: string;
}

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

  if (!varieties.length) return null;

  const selectedVariety = varieties.find((v) => v.id === selectedId);

  const handleSelect = (variety: Variaty) => {
    if (variety.id) {
      setSelectedId(variety.id);
      onVarietyChange(variety);

      // Pass all variety images to update the carousel
      if (
        onVarietyImagesChange &&
        variety.images &&
        variety.images.length > 0
      ) {
        onVarietyImagesChange(variety.images);
      }
    }
  };

  // Group varieties by attributes
  const wattages = [
    ...new Set(varieties.map((v) => v.attributes.wattage).filter(Boolean)),
  ];
  const colorTemps = [
    ...new Set(varieties.map((v) => v.attributes.colorTemp).filter(Boolean)),
  ];

  const getAvailableOptions = (
    type: "wattage" | "colorTemp",
    currentSelection: Variaty,
  ) => {
    // Filter varieties that match the current selection of the other attribute
    if (type === "wattage") {
      return varieties
        .filter(
          (v) =>
            !currentSelection.attributes.colorTemp ||
            v.attributes.colorTemp === currentSelection.attributes.colorTemp,
        )
        .map((v) => v.attributes.wattage)
        .filter(Boolean);
    } else {
      return varieties
        .filter(
          (v) =>
            !currentSelection.attributes.wattage ||
            v.attributes.wattage === currentSelection.attributes.wattage,
        )
        .map((v) => v.attributes.colorTemp)
        .filter(Boolean);
    }
  };

  return (
    <div className="space-y-6">
      {/* Variety Images Preview - Show images for available varieties */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Variety Options
        </label>
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
                )}
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
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wattage Options */}
      {wattages.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Wattage</label>
          <div className="flex flex-wrap gap-2">
            {wattages.map((wattage) => {
              const available = getAvailableOptions(
                "wattage",
                selectedVariety!,
              );
              const isAvailable = available.includes(wattage);
              const isSelected =
                selectedVariety?.attributes.wattage === wattage;

              return (
                <Button
                  key={String(wattage)}
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
                    const variety = varieties.find(
                      (v) =>
                        v.attributes.wattage === wattage &&
                        (!selectedVariety?.attributes.colorTemp ||
                          v.attributes.colorTemp ===
                            selectedVariety.attributes.colorTemp),
                    );
                    if (variety) handleSelect(variety);
                  }}
                >
                  {wattage}W{isSelected && <Check className="ml-1 h-3 w-3" />}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Temperature Options */}
      {colorTemps.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">
            Color Temperature
          </label>
          <div className="flex flex-wrap gap-2">
            {colorTemps.map((temp) => {
              const available = getAvailableOptions(
                "colorTemp",
                selectedVariety!,
              );
              const isAvailable = available.includes(temp);
              const isSelected = selectedVariety?.attributes.colorTemp === temp;

              return (
                <Button
                  key={String(temp)}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    isSelected && "bg-amber-600 hover:bg-amber-700",
                    !isAvailable && "opacity-50 cursor-not-allowed",
                  )}
                  disabled={!isAvailable}
                  onClick={() => {
                    const variety = varieties.find(
                      (v) =>
                        v.attributes.colorTemp === temp &&
                        (!selectedVariety?.attributes.wattage ||
                          v.attributes.wattage ===
                            selectedVariety.attributes.wattage),
                    );
                    if (variety) handleSelect(variety);
                  }}
                >
                  {temp}
                  {isSelected && <Check className="ml-1 h-3 w-3" />}
                </Button>
              );
            })}
          </div>
        </div>
      )}

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
                {/* Multiple images indicator */}
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

              {/* Attribute badges */}
              <div className="flex gap-2 mt-2">
                {selectedVariety.attributes.wattage && (
                  <Badge variant="outline" className="border-amber-300">
                    {selectedVariety.attributes.wattage}W
                  </Badge>
                )}
                {selectedVariety.attributes.colorTemp && (
                  <Badge variant="outline" className="border-amber-300">
                    {selectedVariety.attributes.colorTemp}
                  </Badge>
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
