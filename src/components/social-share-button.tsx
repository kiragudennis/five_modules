// components/social-share-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Facebook,
  Instagram,
  Twitter,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";

interface SocialShareButtonProps {
  module: "spin" | "challenge" | "draw" | "bundle" | "deal";
  moduleId: string;
  shareText: string;
  shareUrl?: string;
  onShare?: (platform: string) => void;
}

export function SocialShareButton({
  module,
  moduleId,
  shareText,
  shareUrl,
  onShare,
}: SocialShareButtonProps) {
  const { supabase } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [sharedPlatform, setSharedPlatform] = useState<string | null>(null);

  const trackShare = async (platform: string) => {
    setSharing(true);
    try {
      // Track the share in database
      await supabase.from("challenge_actions").insert({
        action_type: "share_posted",
        user_id: (await supabase.auth.getUser()).data.user?.id,
        metadata: { platform, module, module_id: moduleId },
      });

      // Also track referrer click
      await supabase.rpc("track_referrer_click", {
        p_source: platform,
        p_source_type: "social",
        p_utm_campaign: `${module}_share`,
      });

      setSharedPlatform(platform);
      setTimeout(() => setSharedPlatform(null), 3000);

      if (onShare) onShare(platform);
      toast.success(`Shared on ${platform}! + points earned`);
    } catch (error) {
      console.error("Error tracking share:", error);
    } finally {
      setSharing(false);
    }
  };

  const shareToPlatform = (platform: string) => {
    const url = shareUrl || window.location.href;
    const text = encodeURIComponent(shareText);

    let shareLink = "";
    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
        break;
      case "instagram":
        // Instagram doesn't have direct share URL, copy to clipboard instead
        navigator.clipboard.writeText(`${shareText}\n\n${url}`);
        toast.success("Link copied! Share on Instagram");
        trackShare(platform);
        return;
      case "whatsapp":
        shareLink = `https://wa.me/?text=${text}%20${encodeURIComponent(url)}`;
        break;
    }

    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400");
      trackShare(platform);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={sharing}>
          {sharedPlatform ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Share</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => shareToPlatform("facebook")}>
          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareToPlatform("twitter")}>
          <Twitter className="h-4 w-4 mr-2 text-sky-500" />
          Twitter/X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareToPlatform("instagram")}>
          <Instagram className="h-4 w-4 mr-2 text-pink-600" />
          Instagram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareToPlatform("whatsapp")}>
          <svg
            className="h-4 w-4 mr-2 text-green-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.588 2.014.896 3.13.897h.003c3.18 0 5.767-2.586 5.768-5.766.001-3.18-2.585-5.766-5.765-5.766zM12.03 18.854h-.002c-1.087-.001-2.154-.277-3.1-.804l-.222-.132-1.645.43.438-1.597-.139-.228c-.631-.982-.966-2.095-.966-3.26.001-3.182 2.591-5.772 5.774-5.772 1.543 0 2.991.601 4.081 1.692 1.09 1.09 1.69 2.538 1.69 4.081-.001 3.182-2.591 5.772-5.774 5.772z" />
          </svg>
          WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
