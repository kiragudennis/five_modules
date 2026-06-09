// components/spin/participants-leaderboard.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Medal, ArrowRight } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  first_spin_at: string;
  spin_count: number;
}

interface ParticipantsLeaderboardProps {
  participants: Participant[];
  totalParticipants: number;
}

export default function ParticipantsLeaderboard({
  participants,
  totalParticipants,
}: ParticipantsLeaderboardProps) {
  const topParticipants = participants.slice(0, 3);

  return (
    <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur border-blue-500/30">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            Participants Leaderboard
          </h3>
          <Badge variant="outline" className="border-blue-500/50 text-blue-300">
            {totalParticipants} players
          </Badge>
        </div>

        {/* Top 3 Medals */}
        {topParticipants.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
            <p className="text-xs text-yellow-400 mb-2">🏆 TOP SPINNERS</p>
            <div className="space-y-2">
              {topParticipants.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-6 text-center">
                    {idx === 0 && <Medal className="h-4 w-4 text-yellow-400" />}
                    {idx === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                    {idx === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                  </div>
                  <Avatar className="h-6 w-6 bg-purple-600">
                    <AvatarFallback className="text-xs">
                      {p.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-white flex-1">{p.name}</span>
                  <span className="text-xs text-purple-300">
                    {p.spin_count} spins
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Participants List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {participants.length === 0 ? (
            <div className="text-center py-8 text-purple-300 text-sm">
              Waiting for players...
            </div>
          ) : (
            participants.map((participant, idx) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8 bg-purple-600">
                    <AvatarFallback>{participant.avatar}</AvatarFallback>
                  </Avatar>
                  {idx === 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {participant.name}
                  </p>
                  <p className="text-xs text-purple-300">
                    {participant.spin_count} spin
                    {participant.spin_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <ArrowRight className="h-3 w-3 text-purple-400" />
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
