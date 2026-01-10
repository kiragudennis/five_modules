import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export function ImageUpload({
  value = [],
  onChange,
  disabled,
  maxFiles = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { supabase } = useAuth();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Please select at least one image.");
      }

      const files = Array.from(event.target.files);

      // Check if we would exceed max files
      if (value.length + files.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} images allowed.`);
      }

      setUploading(true);
      const uploadedUrls: string[] = [];

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files are allowed.");
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("File size must be less than 10MB.");
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          if (uploadError.message.includes("already exists")) {
            throw new Error("An image with this name already exists.");
          }
          throw uploadError;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      onChange([...value, ...uploadedUrls]);
      toast.success(`Uploaded ${files.length} image(s) successfully`);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Error uploading images");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (url: string) => {
    try {
      // Extract file path from URL
      const urlParts = url.split("/");
      const filePath = urlParts
        .slice(urlParts.indexOf("product-images") + 1)
        .join("/");

      // Delete from storage
      const { error } = await supabase.storage
        .from("product-images")
        .remove([filePath]);

      if (error) throw error;

      // Remove from form state
      onChange(value.filter((image) => image !== url));
      toast.success("Image removed successfully");
    } catch (error: any) {
      console.error("Error removing image:", error);
      toast.error("Error removing image");
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-dashed rounded-lg p-6">
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading || disabled || value.length >= maxFiles}
          className="hidden"
        />
        <label
          htmlFor="image-upload"
          className={`flex flex-col items-center justify-center cursor-pointer ${
            uploading || disabled || value.length >= maxFiles
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            {value.length >= maxFiles
              ? `Maximum ${maxFiles} images reached`
              : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, GIF up to 10MB each
          </p>
        </label>
      </div>

      {uploading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Uploading...</span>
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(url)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
