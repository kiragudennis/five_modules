// components/tag-input.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Tag,
  Zap,
  Sparkles,
  Home,
  Building,
  Sun,
  Shield,
} from "lucide-react";
import {
  getCustomerTagsForCategory,
  getAllCustomerTags,
  getTagDisplayName,
  customerTags,
} from "@/lib/constants";
import { lightingCategories } from "@/lib/constants";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  category?: string;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({
  value = [],
  onChange,
  category,
  placeholder = "Add relevant tags...",
  maxTags = 10,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tagCategories, setTagCategories] = useState<{
    [key: string]: string[];
  }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Get category details
  const categoryDetails = lightingCategories.find((cat) => cat.id === category);

  useEffect(() => {
    // Load suggested tags based on category
    const suggestedTags = category
      ? getCustomerTagsForCategory(category)
      : getAllCustomerTags();

    // Organize tags by category for better display
    const organizedTags: { [key: string]: string[] } = {};

    // Use Cases
    const useCaseTags = customerTags.useCases.filter((tag) =>
      suggestedTags.includes(tag)
    );
    if (useCaseTags.length > 0) organizedTags["Use Cases"] = useCaseTags;

    // Benefits
    const benefitTags = customerTags.needsBenefits.filter((tag) =>
      suggestedTags.includes(tag)
    );
    if (benefitTags.length > 0) organizedTags["Key Benefits"] = benefitTags;

    // Special Offers
    const offerTags = customerTags.specialOffers.filter((tag) =>
      suggestedTags.includes(tag)
    );
    if (offerTags.length > 0) organizedTags["Special Offers"] = offerTags;

    setTagCategories(organizedTags);
  }, [category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.trim()) {
      // Filter all tags based on input
      const allTags = getAllCustomerTags();
      const filtered = allTags.filter(
        (tag) =>
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !value.includes(tag) &&
          !value.includes(tag)
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const addTag = (tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    if (cleanTag && !value.includes(cleanTag) && value.length < maxTags) {
      onChange([...value, cleanTag]);
      setInput("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim() && value.length < maxTags) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get icon for tag category
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case "Use Cases":
        return <Home className="h-3 w-3" />;
      case "Key Benefits":
        return <Zap className="h-3 w-3" />;
      case "Special Offers":
        return <Sparkles className="h-3 w-3" />;
      case "Customer Types":
        return <Building className="h-3 w-3" />;
      case "Energy & Cost":
        return <Sun className="h-3 w-3" />;
      case "Security":
        return <Shield className="h-3 w-3" />;
      default:
        return <Tag className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Tags Display */}
      <div className="flex flex-wrap gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
        {value.length > 0 ? (
          value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-300 text-amber-700 dark:text-amber-300"
            >
              {getTagDisplayName(tag)}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            No tags added yet. Add tags to help customers find this product.
          </div>
        )}
      </div>

      {/* Category Context */}
      {categoryDetails && (
        <div className="flex items-center gap-2 text-sm">
          <div
            className={`w-6 h-6 rounded bg-gradient-to-r ${categoryDetails.color} flex items-center justify-center`}
          >
            {categoryDetails.icon && (
              <categoryDetails.icon className="w-3 h-3 text-white" />
            )}
          </div>
          <span className="font-medium">
            Suggested tags for {categoryDetails.name}:
          </span>
        </div>
      )}

      {/* Tag Suggestions by Category */}
      <div className="space-y-3">
        {Object.entries(tagCategories).map(([categoryName, tags]) => (
          <div key={categoryName} className="space-y-2">
            <div className="flex items-center gap-2">
              {getCategoryIcon(categoryName)}
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {categoryName}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-600 text-xs px-2 py-1"
                  onClick={() => addTag(tag)}
                >
                  {getTagDisplayName(tag)}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Tag Input */}
      <div className="relative" ref={inputRef}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={
              value.length >= maxTags
                ? `Maximum ${maxTags} tags reached`
                : placeholder
            }
            className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={value.length >= maxTags}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => input.trim() && addTag(input)}
            disabled={!input.trim() || value.length >= maxTags}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
          >
            Add
          </Button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="flex w-full items-center px-3 py-2 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300"
              >
                <Tag className="h-3 w-3 mr-2 text-gray-400" />
                <span>{getTagDisplayName(tag)}</span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {tag}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <div className="flex justify-between items-center">
          <span>
            {value.length}/{maxTags} tags added
          </span>
          <span className="text-amber-600 dark:text-amber-400">
            {maxTags - value.length} tags remaining
          </span>
        </div>
        <p className="pt-2 border-t border-gray-200 dark:border-gray-700">
          💡 Add tags that describe how customers will use this product, key
          benefits, or special features. Tags help customers find products that
          match their needs.
        </p>
      </div>
    </div>
  );
}

// Simple Button component for internal use
function Button({
  children,
  onClick,
  disabled,
  className = "",
  size = "default",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
  type?: "button" | "submit";
}) {
  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    default: "h-10 px-4 py-2",
    lg: "h-12 px-6 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-md font-medium 
        ring-offset-background transition-colors 
        focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-ring focus-visible:ring-offset-2 
        disabled:pointer-events-none disabled:opacity-50
        ${sizeClasses[size]} ${className}
      `}
    >
      {children}
    </button>
  );
}
