"use client";
import { useState } from "react";
import { Product } from "@/types/store";
import {
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon,
  WhatsappShareButton,
  WhatsappIcon,
  TelegramShareButton,
  TelegramIcon,
  InstapaperShareButton,
  InstagramIcon,
} from "next-share";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Copy, Gift, Share2, CheckCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useAuth } from "@/lib/context/AuthContext";

interface ShareOption {
  Component: React.ComponentType<any>;
  Icon: React.ComponentType<{ size: number; round: boolean }>;
  props: Record<string, any>;
  label: string;
}

interface ProductShareProps {
  product: Product;
  url: string;
}

export default function ProductShare({ product, url }: ProductShareProps) {
  const [copied, setCopied] = useState(false);
  const { profile } = useAuth();

  if (!url) return null;

  const referralPoints = product.referral_points || 100;
  const shareText = `🌟 Earn ${referralPoints} Points! 🌟\n\n${product.title} - Only ${product.price} KES at Blessed Two Electronics!\n\nShare this link and earn ${referralPoints} loyalty points when friends make their first purchase! 🚀\n\n`;

  const whatsappText = `🌟 *Earn ${referralPoints} Points!* 🌟\n\n*${product.title}*\nOnly *${product.price} KES* at Blessed Two Electronics!\n\n🔗 ${url}\n\nShare with friends and earn ${referralPoints} loyalty points when they make their first purchase! 🎁`;

  const shareOptions: ShareOption[] = [
    {
      Component: FacebookShareButton,
      Icon: FacebookIcon,
      props: {
        quote: shareText,
        hashtag: "#BlessedTwoElectronics #LightingDeals",
      },
      label: "Share on Facebook",
    },
    {
      Component: TwitterShareButton,
      Icon: TwitterIcon,
      props: {
        title: shareText,
        hashtags: ["Lighting", "Electronics", "Deals", "Nairobi"].concat(
          product.tags || [],
        ),
      },
      label: "Share on Twitter",
    },
    {
      Component: WhatsappShareButton,
      Icon: WhatsappIcon,
      props: {
        title: whatsappText,
        separator: " - ",
      },
      label: "Share on WhatsApp",
    },
    {
      Component: TelegramShareButton,
      Icon: TelegramIcon,
      props: { title: shareText },
      label: "Share on Telegram",
    },
    {
      Component: InstapaperShareButton,
      Icon: InstagramIcon,
      props: { title: shareText },
      label: "Share on Instagram",
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      toast.success(
        <div className="flex items-start gap-3">
          <Gift className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Referral Link Copied! 🎉</p>
            <p className="text-sm text-muted-foreground">
              Share with friends to earn{" "}
              <span className="font-bold text-green-600">
                {referralPoints} points
              </span>
            </p>
          </div>
        </div>,
        { duration: 5000 },
      );

      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopied(true);
      setTimeout(() => setCopied(false), 3000);

      toast.success("Link copied to clipboard!");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Earn ${referralPoints} Points! - ${product.title}`,
          text: shareText,
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-4">
      {/* Referral Points Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            Share & Earn Points 💰
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
              <Gift className="h-3 w-3 mr-1" />
              {referralPoints} Points
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground cursor-help">
                    How it works?
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-medium">Earn Points by Sharing:</p>
                    <ul className="space-y-1 text-xs">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Share your referral link</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Friend makes their first purchase</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>You earn {referralPoints} loyalty points</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Points can be redeemed for discounts</span>
                      </li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {!profile && (
          <Badge
            variant="outline"
            className="text-xs border-amber-300 text-amber-600"
          >
            Sign in to get your referral link
          </Badge>
        )}
      </div>

      {/* Social Media Share Buttons */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Share via social media:
        </p>
        <div
          className="grid grid-cols-5 gap-2"
          role="group"
          aria-label="Social media sharing options"
        >
          {shareOptions.map(({ Component, Icon, props, label }, index) => (
            <Component
              key={`${label}-${index}`}
              url={url}
              {...props}
              aria-label={label}
              className="transition-transform hover:scale-105 active:scale-95"
            >
              <div className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Icon size={36} round />
                <span className="sr-only">{label}</span>
              </div>
            </Component>
          ))}
        </div>
      </div>

      {/* Quick Share Button for Mobile */}
      <div className="sm:hidden">
        <Button
          onClick={handleShare}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
          size="sm"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Quick Share
        </Button>
      </div>

      {/* Copy Referral Link Section */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Your referral link:
        </p>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              type="text"
              value={url}
              readOnly
              className="flex-1 px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm bg-muted/40 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              aria-label="Referral URL to share"
            />
            {copied && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Badge className="bg-green-500 text-white text-xs">
                  Copied!
                </Badge>
              </div>
            )}
          </div>
          <Button
            onClick={handleCopy}
            className={`px-4 py-2 ${
              copied
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            } text-white rounded-lg transition-all duration-200 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:ring-offset-2 outline-none`}
            aria-live="polite"
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
        </div>

        {/* Referral Explanation */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-xs text-green-700 dark:text-green-300">
            <strong>How referral points work:</strong> When someone uses your
            link and makes their first purchase, you'll earn{" "}
            <span className="font-bold">{referralPoints} loyalty points</span>.
            Points can be redeemed for discounts on future orders!
          </p>
        </div>
      </div>
    </div>
  );
}
