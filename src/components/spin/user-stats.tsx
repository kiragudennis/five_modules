// components/spin/UserStats.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

interface UserStatsProps {
  spinsUsedToday: number;
  freeSpinsPerDay: number;
  freeRemainingToday: number;
  pointsBalance: number;
}

export default function UserStats({
  spinsUsedToday,
  freeSpinsPerDay,
  freeRemainingToday,
  pointsBalance,
}: UserStatsProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Your Stats
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Free Spins Today</span>
              <span className="font-medium">
                {freeRemainingToday} / {freeSpinsPerDay}
              </span>
            </div>
            <Progress
              value={(spinsUsedToday / freeSpinsPerDay) * 100}
              className="h-2"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Points Balance</span>
              <span className="font-medium text-amber-600">
                {pointsBalance.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="pt-2 text-xs text-muted-foreground">
            <p>• Free spins reset daily</p>
            <p>• Earn points by making purchases</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
