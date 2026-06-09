// components/live-spin-wheel.tsx
"use client";

import { memo, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamically import the wheel component with no SSR
const Wheel = dynamic(
  () => import("react-custom-roulette").then((mod) => mod.Wheel),
  {
    ssr: false,
    loading: () => (
      <div className="w-[300px] h-[300px] bg-white/10 rounded-full animate-pulse flex items-center justify-center">
        <span className="text-white/50">Loading wheel...</span>
      </div>
    ),
  },
);

interface SpinWheelProps {
  mustSpin: boolean;
  prizeNumber: number;
  data: Array<{
    option: string;
    style: { backgroundColor: string };
  }>;
  spinDuration?: number;
  onStopSpinning: () => void;
  outerBorderColor?: string;
  outerBorderWidth?: number;
  innerRadius?: number;
  radiusLineColor?: string;
  radiusLineWidth?: number;
  textDistance?: number;
  fontSize?: number;
}

const SpinWheel = memo(function SpinWheel({
  mustSpin,
  prizeNumber,
  data,
  spinDuration = 0.8,
  onStopSpinning,
  outerBorderColor = "#e2e8f0",
  outerBorderWidth = 3,
  innerRadius = 15,
  radiusLineColor = "#e2e8f0",
  radiusLineWidth = 2,
  textDistance = 65,
  fontSize = 14,
}: SpinWheelProps) {
  // Stable callback
  const handleStopSpinning = useCallback(() => {
    onStopSpinning();
  }, [onStopSpinning]);

  return (
    <Wheel
      mustStartSpinning={mustSpin}
      prizeNumber={prizeNumber}
      data={data}
      spinDuration={spinDuration}
      onStopSpinning={handleStopSpinning}
      outerBorderColor={outerBorderColor}
      outerBorderWidth={outerBorderWidth}
      innerRadius={innerRadius}
      radiusLineColor={radiusLineColor}
      radiusLineWidth={radiusLineWidth}
      textDistance={textDistance}
      fontSize={fontSize}
    />
  );
});

export default SpinWheel;
