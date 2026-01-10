// components/tag-input.tsx
"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { getAvailableTagsForCategory } from "@/lib/utils";
import { categoryOptions } from "@/lib/constants";

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
  placeholder = "Add tags...",
  maxTags = 5,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    if (category) {
      const tags = getAvailableTagsForCategory(category);
      setAvailableTags(tags);
    }
  }, [category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.trim()) {
      // Filter suggestions based on input
      const filtered = availableTags.filter(
        (tag) =>
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !value.includes(tag)
      );
      setSuggestions(filtered.slice(0, 3)); // Limit to 3 suggestions
    } else {
      setSuggestions([]);
    }
  };

  const addTag = (tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    if (cleanTag && !value.includes(cleanTag) && value.length < maxTags) {
      onChange([...value, cleanTag]);
      setInput("");
      setSuggestions([]);
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
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 px-3 py-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            value.length >= maxTags
              ? `Maximum ${maxTags} tags reached`
              : placeholder
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={value.length >= maxTags}
        />

        {/* Tag Suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {category
              ? `Suggested for ${
                  categoryOptions.find((c) => c.id === category)?.name
                }`
              : "Enter a category first for tag suggestions"}
          </span>
          <span>
            {value.length}/{maxTags}
          </span>
        </div>

        {/* Popular Tags Chip */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">Quick add:</span>
          {availableTags.slice(0, 4).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer hover:bg-secondary text-xs px-2 py-0.5"
              onClick={() => addTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
