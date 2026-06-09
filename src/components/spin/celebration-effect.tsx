// components/spin/celebration-effect.tsx
"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Trophy, Sparkles, Gift, Crown } from "lucide-react";

interface CelebrationEffectProps {
  winner: {
    name: string;
    prize: string;
    prizeType?: string;
  } | null;
  onComplete: () => void;
}

export function CelebrationEffect({
  winner,
  onComplete,
}: CelebrationEffectProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!winner) return;

    // Show celebration
    setShowCelebration(true);

    // Trigger confetti based on prize type
    const prizeType =
      winner.prizeType ||
      (winner.prize.includes("Points") ? "points" : "normal");

    if (prizeType === "grand_prize") {
      // Grand prize - massive celebration
      confetti({
        particleCount: 300,
        spread: 150,
        origin: { y: 0.6 },
        startVelocity: 25,
        colors: ["#ffd700", "#ffed4e", "#ffa500", "#ff6b6b"],
      });

      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5, x: 0.3 },
          startVelocity: 20,
        });
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5, x: 0.7 },
          startVelocity: 20,
        });
      }, 200);
    } else if (prizeType === "points" || winner.prize.includes("Points")) {
      // Points win - subtle celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#4ade80", "#22c55e", "#16a34a"],
      });
    } else {
      // Normal win - standard celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#a855f7", "#d946ef", "#ec4899"],
      });
    }

    // Auto-hide after 4 seconds
    const timer = setTimeout(() => {
      setShowCelebration(false);
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [winner, onComplete]);

  if (!showCelebration || !winner) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Animated banner */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce-in">
        <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500 rounded-2xl p-8 shadow-2xl animate-pulse-glow">
          <div className="text-center">
            <Trophy className="h-16 w-16 text-white mx-auto mb-3 animate-wiggle" />
            <h2 className="text-3xl font-bold text-white mb-2">WINNER!</h2>
            <p className="text-xl text-white font-semibold">{winner.name}</p>
            <p className="text-lg text-yellow-100 mt-2">Won {winner.prize}</p>
            <div className="flex justify-center gap-2 mt-4">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
              <Sparkles className="h-5 w-5 text-white animate-pulse delay-150" />
              <Sparkles className="h-5 w-5 text-white animate-pulse delay-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            {Math.random() > 0.5 ? (
              <Sparkles className="h-4 w-4 text-yellow-400" />
            ) : (
              <Gift className="h-4 w-4 text-pink-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
