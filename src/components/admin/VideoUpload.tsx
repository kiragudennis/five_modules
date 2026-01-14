// components/admin/VideoUpload.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Video, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface VideoUploadProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function VideoUpload({ value, onChange, disabled }: VideoUploadProps) {
  const { supabase } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(value || "");

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["video/mp4", "video/webm", "video/ogg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a video file (MP4, WebM, or OGG)");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video file must be less than 50MB");
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `product-videos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("product-videos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("product-videos")
        .getPublicUrl(filePath);

      const url = data.publicUrl;
      setVideoUrl(url);
      onChange(url);
      toast.success("Video uploaded successfully");
    } catch (error: any) {
      console.error("Video upload error:", error);
      toast.error(error.message || "Failed to upload video");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);
    onChange(url);
  };

  const handleRemoveVideo = () => {
    setVideoUrl("");
    onChange("");
  };

  return (
    <div className="space-y-4">
      {videoUrl ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">Video uploaded</p>
                <p className="text-sm text-gray-500 truncate max-w-md">
                  {videoUrl}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveVideo}
              disabled={disabled || isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Upload product demonstration video
          </p>
          <p className="text-sm text-gray-500 mb-6">
            MP4, WebM, or OGG • Max 50MB
          </p>

          <div className="space-y-4">
            <div>
              <Input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                disabled={disabled || isUploading}
                className="hidden"
                id="video-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("video-upload")?.click()}
                disabled={disabled || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Video
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <div>
              <Input
                type="url"
                placeholder="Paste YouTube or Vimeo URL"
                value={videoUrl}
                onChange={handleUrlInput}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs">
          Show installation
        </Badge>
        <Badge variant="outline" className="text-xs">
          Demonstrate features
        </Badge>
        <Badge variant="outline" className="text-xs">
          Compare products
        </Badge>
      </div>
    </div>
  );
}
