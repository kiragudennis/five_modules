// components/spin/live-wheel.tsx
"use client";

import { memo } from "react";
import SpinWheel from "@/components/spin/spin-wheel";

interface LiveWheelProps {
  mustSpin: boolean;
  prizeNumber: number;
  data: Array<{
    option: string;
    style: { backgroundColor: string };
  }>;
  spinning: boolean;
  onStopSpinning: () => void;
}

const LiveWheel = memo(function LiveWheel({
  mustSpin,
  prizeNumber,
  data,
  spinning,
  onStopSpinning,
}: LiveWheelProps) {
  return (
    <div className="relative">
      <SpinWheel
        mustSpin={mustSpin}
        prizeNumber={prizeNumber}
        data={data}
        spinDuration={1.0}
        onStopSpinning={onStopSpinning}
        outerBorderColor="#9333ea"
        outerBorderWidth={3}
        innerRadius={5}
        radiusLineColor="#9333ea"
        radiusLineWidth={2}
        textDistance={65}
        fontSize={14}
      />

      {/* Spin Overlay Effect */}
      {spinning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-pulse rounded-full" />
        </div>
      )}
    </div>
  );
});

export default LiveWheel;
