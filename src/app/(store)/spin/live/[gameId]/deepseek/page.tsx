// src/app/(store)/spin/live/[gameId]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LiveDisplayShell } from '@/components/live/live-display-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/context/AuthContext';
import { usePolling } from '@/hooks/usePolling';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { SpinningWheelService } from '@/lib/services/spinning-wheel-service';

export default function SpinLivePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { supabase } = useAuth();
  const [game, setGame] = useState<any>(null);
  const [tickerItems, setTickerItems] = useState<string[]>([]);
  const [totalSpins, setTotalSpins] = useState(0);
  const [grandPrizeRemaining, setGrandPrizeRemaining] = useState<boolean>(true);

  const wheelService = new SpinningWheelService();

  const load = async () => {
    // Get game details
    const { data: gameData } = await supabase
      .from('spin_games')
      .select('*')
      .eq('id', gameId)
      .single();
    setGame(gameData);
    setGrandPrizeRemaining(!gameData?.single_prize_claimed);

    // Get ticker
    const ticker = await wheelService.getLiveTicker(gameId as string, 30);
    setTickerItems(ticker.map(t => `${t.user_name} won ${t.prize_text}`));

    // Get total spin count
    const { count } = await supabase
      .from('spin_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId);
    setTotalSpins(count || 0);
  };

  useEffect(() => {
    void load();
  }, [gameId]);

  usePolling(load, { intervalMs: 3000 });
  useSupabaseRealtime({
    supabase,
    channelName: `spin-live-${gameId}`,
    tables: [
      { table: 'spin_attempts', filter: `game_id=eq.${gameId}` },
      { table: 'spin_live_ticker', filter: `game_id=eq.${gameId}` },
      { table: 'spin_games', filter: `id=eq.${gameId}` },
    ],
    onEvent: () => void load(),
    enabled: Boolean(gameId),
  });

  const prizeConfig = game?.prize_config || [];
  const topPrize = prizeConfig.find((p: any) => p.type === 'discount' && p.value > 20) || prizeConfig[0];

  return (
    <LiveDisplayShell
      title={game?.name || 'Spin to Win'}
      subtitle={grandPrizeRemaining ? `Grand Prize: ${topPrize?.label}` : 'Grand Prize Claimed!'}
      activeCount={totalSpins}
      tickerItems={tickerItems}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl font-bold text-yellow-500 mb-2">
              {totalSpins}
            </div>
            <p className="text-slate-400">Total Spins</p>
            
            {grandPrizeRemaining && game?.is_single_prize && (
              <div className="mt-4 p-3 bg-yellow-500/20 rounded border border-yellow-500/50">
                <p className="text-yellow-400 font-bold animate-pulse">
                  GRAND PRIZE STILL AVAILABLE!
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Next spin could be the winner
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="pt-6">
            <p className="mb-2 text-sm text-slate-400">Prize Pool</p>
            <div className="space-y-2">
              {prizeConfig.slice(0, 6).map((prize: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: prize.color }}
                    />
                    <span>{prize.label}</span>
                  </div>
                  <Badge variant="outline">{prize.probability}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </LiveDisplayShell>
  );
}