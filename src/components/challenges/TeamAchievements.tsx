// components/challenges/TeamAchievements.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Star,
  Zap,
  Target,
  Users,
  ShoppingBag,
  Flame,
  Clock,
  Award,
  Lock,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
  type: string;
  name: string;
  description: string;
  icon: any;
  unlocked: boolean;
  progress: number;
  target: number;
  unlocked_at?: string;
}

export function TeamAchievements({ teamId }: { teamId: string }) {
  const achievements: Achievement[] = [
    {
      type: "first_blood",
      name: "First Blood",
      description: "Team makes their first purchase",
      icon: ShoppingBag,
      unlocked: true,
      progress: 100,
      target: 1,
    },
    {
      type: "team_full",
      name: "Full House",
      description: "Reach maximum team members",
      icon: Users,
      unlocked: false,
      progress: 3,
      target: 5,
    },
    {
      type: "big_spenders",
      name: "Big Spenders",
      description: "Team spending reaches KSH 10,000",
      icon: Award,
      unlocked: false,
      progress: 7500,
      target: 10000,
    },
    {
      type: "consistency",
      name: "Consistency King",
      description: "All members active for 7 consecutive days",
      icon: Flame,
      unlocked: false,
      progress: 5,
      target: 7,
    },
    {
      type: "top_team",
      name: "Top of the League",
      description: "Reach #1 rank on leaderboard",
      icon: Trophy,
      unlocked: false,
      progress: 0,
      target: 1,
    },
    {
      type: "speed_demon",
      name: "Speed Demon",
      description: "Complete 5 purchases in a single day",
      icon: Zap,
      unlocked: false,
      progress: 2,
      target: 5,
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Team Achievements
        </h3>
        <div className="grid gap-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            const progressPercent =
              (achievement.progress / achievement.target) * 100;

            return (
              <div
                key={achievement.type}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  achievement.unlocked
                    ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200"
                    : "bg-muted/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      achievement.unlocked ? "bg-yellow-100" : "bg-muted",
                    )}
                  >
                    {achievement.unlocked ? (
                      <Check className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{achievement.name}</h4>
                      {achievement.unlocked && (
                        <Badge className="bg-yellow-100 text-yellow-700">
                          Unlocked!
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <Progress value={progressPercent} className="flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {achievement.progress}/{achievement.target}
                      </span>
                    </div>
                  </div>

                  <Icon
                    className={cn(
                      "h-5 w-5",
                      achievement.unlocked
                        ? "text-yellow-500"
                        : "text-muted-foreground",
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
