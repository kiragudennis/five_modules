import React from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { cn } from "@/lib/utils";

export interface LottieIconProps {
  animation: any; // Lottie animation JSON
  isCategory?: boolean; // If true, applies category styling
}

export const LottieIcon = ({
  animation,
  isCategory = false,
}: LottieIconProps) => {
  return (
    <div
      className={
        "h-32 w-32 rounded-full flex items-center justify-center transition-all duration-300"
      }
    >
      <Lottie
        animationData={animation}
        loop={true}
        autoplay={true}
        className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 cursor-pointer"
      />
    </div>
  );
};
