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

  if (!url) return null;

  const shareText = `${product.name} - only $${product.price}! 🚀`;
  const tags = product.tags;

  const shareOptions: ShareOption[] = [
    {
      Component: FacebookShareButton,
      Icon: FacebookIcon,
      props: { quote: shareText },
      label: "Share on Facebook",
    },
    {
      Component: TwitterShareButton,
      Icon: TwitterIcon,
      props: { title: shareText, hashtags: tags },
      label: "Share on Twitter",
    },
    {
      Component: WhatsappShareButton,
      Icon: WhatsappIcon,
      props: { title: shareText, separator: " - " },
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
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        navigator.clipboard
          .writeText("Text to copy")
          .then(() => console.log("Text copied to clipboard"))
          .catch((err) => console.error("Failed to copy text: ", err));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy also failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground mt-4">
        Share this product 💬
      </p>

      <div
        className="grid grid-cols-5 sm:grid-cols-6 gap-1 sm:gap-3"
        role="group"
        aria-label="Social media sharing options"
      >
        {shareOptions.map(({ Component, Icon, props, label }, index) => (
          <Component
            key={`${label}-${index}`}
            url={url}
            {...props}
            aria-label={label}
          >
            <div className="flex flex-col items-center space-y-1">
              <Icon size={42} round />
              <span className="sr-only">{label}</span>
            </div>
          </Component>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <Input
          type="text"
          value={url}
          readOnly
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-muted/40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
          aria-label="Product URL to share"
        />
        <Button
          onClick={handleCopy}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 active:bg-teal-800 disabled:bg-gray-400 transition-all duration-200 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 outline-none"
          disabled={copied}
          aria-live="polite"
        >
          {copied ? "Copied ✅" : "Copy Link"}
        </Button>
      </div>
    </div>
  );
}
