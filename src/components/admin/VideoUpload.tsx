// components/admin/VideoUpload.tsx - Fixed version
"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  Video,
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoUploadProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxSizeMB?: number;
}

interface UploadProgress {
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
}

export function VideoUpload({
  value,
  onChange,
  disabled,
  maxSizeMB = 100,
}: VideoUploadProps) {
  const { supabase } = useAuth();
  const [videoUrl, setVideoUrl] = useState(value || "");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous state
    setUploadError(null);
    setUploadProgress(null);

    // Validate file type
    const validTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-msvideo",
    ];

    if (!validTypes.includes(file.type)) {
      toast.error(
        "Please upload a supported video file (MP4, WebM, OGG, MOV, AVI)"
      );
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`Video file must be less than ${maxSizeMB}MB`);
      return;
    }

    setFileName(file.name);
    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const uniqueFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `product-videos/${uniqueFileName}`;

      // Create abort controller for cancel functionality
      abortControllerRef.current = new AbortController();

      // Get signed upload URL
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("product-videos")
          .createSignedUploadUrl(filePath, {
            upsert: false, // Don't overwrite existing files
          });

      if (signedUrlError) throw signedUrlError;
      if (!signedUrlData?.signedUrl) throw new Error("No signed URL returned");

      // Upload using fetch with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress({
            progress,
            uploadedBytes: event.loaded,
            totalBytes: event.total,
          });
        }
      });

      // Wrap in promise for async/await
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed due to network error"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload was cancelled"));
        });
      });

      xhr.open("PUT", signedUrlData.signedUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      // Send the file
      xhr.send(file);

      await uploadPromise;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("product-videos")
        .getPublicUrl(filePath);

      const url = publicUrlData.publicUrl;
      setVideoUrl(url);
      onChange(url);

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Video uploaded successfully!</span>
        </div>
      );

      // Auto-clear progress after 3 seconds
      setTimeout(() => {
        setUploadProgress(null);
      }, 3000);
    } catch (error: any) {
      console.error("Video upload error:", error);

      // Check if it was a cancellation
      if (error.message === "Upload was cancelled") {
        toast.info("Upload cancelled");
      } else {
        const errorMessage = error.message || "Failed to upload video";
        setUploadError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
      // Clear file input
      e.target.value = "";
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsUploading(false);
    setUploadProgress(null);
    setUploadError(null);
  };

  const handleRetryUpload = () => {
    setUploadError(null);
    // Trigger file input click to restart upload
    const fileInput = document.getElementById(
      "video-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleUrlInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);
    onChange(url);
  };

  const handleRemoveVideo = async () => {
    if (!videoUrl) return;

    try {
      // Extract file path from URL
      const urlParts = videoUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `product-videos/${fileName}`;

      // Delete from storage
      const { error } = await supabase.storage
        .from("product-videos")
        .remove([filePath]);

      if (error) throw error;

      setVideoUrl("");
      onChange("");
      toast.success("Video removed successfully");
    } catch (error: any) {
      console.error("Error removing video:", error);
      toast.error("Failed to remove video");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Current Video Display */}
      {videoUrl && !isUploading && (
        <div className="space-y-4 w-full max-w-full">
          {/* Video Info Bar - FIXED VERSION */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-amber-200 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 w-full max-w-full overflow-hidden">
            <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
              <Video className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 overflow-hidden w-full">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium text-gray-900 dark:text-white truncate flex-1">
                    Video uploaded
                  </p>
                  <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex-shrink-0">
                    Demo
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate w-full">
                  {videoUrl.replace(/^https?:\/\//, "").split("/")[0]}
                </p>
                {fileName && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-400">File:</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">
                      {fileName}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveVideo}
              disabled={disabled}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 mt-2 sm:mt-0 self-end sm:self-center"
            >
              <X className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only ml-1">Remove</span>
            </Button>
          </div>

          {/* Video Player - Using CSS Grid containment */}
          <div className="relative bg-black rounded-lg overflow-hidden border border-gray-300 w-full max-w-full">
            <div className="grid place-items-center w-full h-0 pb-[56.25%] relative">
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <video
                  src={videoUrl}
                  controls
                  className="w-auto h-auto w-full max-h-full object-contain"
                  poster="/images/demo-play.png"
                />
              </div>
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded hidden sm:block">
                <Play className="w-3 h-3 inline mr-1" />
                Demo Video
              </div>
            </div>
            {/* Mobile label */}
            <div className="sm:hidden bg-black/70 text-white text-xs px-3 py-2 text-center">
              <Play className="w-3 h-3 inline mr-1" />
              Product Demonstration Video
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && uploadProgress && (
        <div className="space-y-3 p-4 border border-amber-200 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 w-full max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600 flex-shrink-0" />
              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                Uploading video...
              </span>
            </div>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300 flex-shrink-0 mt-1 sm:mt-0">
              {uploadProgress.progress}%
            </span>
          </div>

          <Progress
            value={uploadProgress.progress}
            className="h-2 bg-amber-100 dark:bg-amber-900/30 w-full"
          />

          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 w-full">
            <span>{formatFileSize(uploadProgress.uploadedBytes)}</span>
            <span>{formatFileSize(uploadProgress.totalBytes)}</span>
          </div>

          <div className="pt-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelUpload}
              className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto"
            >
              <X className="w-3 h-3 mr-1" />
              Cancel Upload
            </Button>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="w-full max-w-full">
          <Alert
            variant="destructive"
            className="border-red-300 bg-red-50 dark:bg-red-900/20 w-full max-w-full"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
              <span className="text-sm break-words flex-1 min-w-0">
                {uploadError}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRetryUpload}
                className="h-7 px-2 text-xs hover:bg-red-100 flex-shrink-0 mt-2 sm:mt-0"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Upload Form */}
      {(!videoUrl || uploadError) && !isUploading && (
        <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-xl p-4 sm:p-8 text-center transition-all hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 w-full max-w-full overflow-hidden">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 flex items-center justify-center">
            <Video className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="space-y-3 mb-6 w-full">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
              Product Demonstration Video
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload a short video showcasing product features, installation, or
              usage. Videos help increase conversion by up to 80%!
            </p>
          </div>

          <div className="space-y-4 w-full">
            {/* File Upload */}
            <div className="w-full">
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
                onClick={() => document.getElementById("video-upload")?.click()}
                disabled={disabled || isUploading}
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg text-sm sm:text-base"
              >
                {uploadError ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Select Video File
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                MP4, WebM, OGG, MOV, AVI • Max {maxSizeMB}MB
              </p>
            </div>

            {/* Or Divider */}
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-amber-200 dark:border-amber-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-3 text-amber-600 dark:text-amber-400">
                  Or
                </span>
              </div>
            </div>

            {/* External URL - Fixed width */}
            <div className="w-full">
              <div className="relative w-full">
                <Input
                  type="url"
                  placeholder="Paste YouTube, Vimeo, or direct video URL"
                  value={videoUrl}
                  onChange={handleUrlInput}
                  disabled={disabled || isUploading}
                  className="border-amber-300 focus:border-amber-500 focus:ring-amber-500 text-sm sm:text-base w-full max-w-full"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                Supported: YouTube, Vimeo, MP4 URLs
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-amber-200 dark:border-amber-800 w-full">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 text-center sm:text-left">
              📹 Video Upload Tips:
            </h4>
            <div className="grid grid-cols-1 gap-3 text-left">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Keep videos under 2 minutes for best engagement
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Show installation, features, and usage
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Include lighting demonstrations in different settings
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tag Suggestions */}
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start w-full">
        <Badge
          variant="outline"
          className="text-xs border-amber-300 text-amber-700 dark:text-amber-300"
        >
          <Video className="w-3 h-3 mr-1" />
          <span className="hidden xs:inline">Installation</span>
          <span className="xs:hidden">Install</span>
        </Badge>
        <Badge
          variant="outline"
          className="text-xs border-blue-300 text-blue-700 dark:text-blue-300"
        >
          <Play className="w-3 h-3 mr-1" />
          <span className="hidden xs:inline">Features</span>
          <span className="xs:hidden">Demo</span>
        </Badge>
        <Badge
          variant="outline"
          className="text-xs border-green-300 text-green-700 dark:text-green-300"
        >
          <Zap className="w-3 h-3 mr-1" />
          <span className="hidden xs:inline">Performance</span>
          <span className="xs:hidden">Test</span>
        </Badge>
        <Badge
          variant="outline"
          className="text-xs border-purple-300 text-purple-700 dark:text-purple-300"
        >
          <Pause className="w-3 h-3 mr-1" />
          <span className="hidden xs:inline">Before/After</span>
          <span className="xs:hidden">Compare</span>
        </Badge>
      </div>
    </div>
  );
}
