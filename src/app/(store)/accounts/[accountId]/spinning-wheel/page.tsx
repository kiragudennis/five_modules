// src/app/(store)/accounts/[accountId]/spin/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, Gift, Zap, Trophy, Users, Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { SpinningWheel as WheelComponent } from '@/components/loyalty/spinning-wheel';
import { SpinGame, UserSpinAllocation } from '@/types/spinning-wheel';
import { SpinningWheelService } from '@/lib/services/spinning-wheel-service';

export default function SpinningWheelPage() {
  const { accountId } = useParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [games, setGames] = useState<SpinGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<SpinGame | null>(null);
  const [allocation, setAllocation] = useState<UserSpinAllocation | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [recentWins, setRecentWins] = useState<any[]>([]);
  const [pointsBalance, setPointsBalance] = useState(0);

  const wheelService = new SpinningWheelService();

  useEffect(() => {
    if (!profile || profile.id !== accountId) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [accountId, profile]);

  const fetchData = async () => {
    const availableGames = await wheelService.getAvailableGames(accountId as string);
    setGames(availableGames);
    
    if (availableGames.length > 0 && !selectedGame) {
      setSelectedGame(availableGames[0]);
    }
  };

  const fetchAllocation = useCallback(async () => {
    if (!selectedGame) return;
    const alloc = await wheelService.getUserAllocation(accountId as string, selectedGame.id);
    setAllocation(alloc);
  }, [selectedGame, accountId]);

  const fetchPoints = useCallback(async () => {
    const { data } = await supabase
      .from('loyalty_points')
      .select('points')
      .eq('user_id', accountId)
      .single();
    setPointsBalance(data?.points || 0);
  }, [accountId, supabase]);

  useEffect(() => {
    if (selectedGame) {
      fetchAllocation();
      fetchPoints();
    }
  }, [selectedGame, fetchAllocation, fetchPoints]);

  const handleSpin = async (spinType: 'free' | 'points') => {
    if (spinning) return;
    setSpinning(true);

    try {
      const result = await wheelService.spin(accountId as string, selectedGame!.id, spinType);
      
      toast.success(`You won: ${result.prizeDisplay}!`, {
        duration: 5000,
        icon: '🎁',
      });
      
      await fetchAllocation();
      await fetchPoints();
      
      // Refresh recent wins
      const { data: wins } = await supabase
        .from('spin_attempts')
        .select('*, profiles(full_name)')
        .eq('game_id', selectedGame!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentWins(wins || []);
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSpinning(false);
    }
  };

  const getGameIcon = (type: string) => {
    switch (type) {
      case 'vip': return <Trophy className="h-5 w-5" />;
      case 'new_customer': return <Users className="h-5 w-5" />;
      case 'weekend': return <Calendar className="h-5 w-5" />;
      case 'flash': return <Zap className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  if (games.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Active Games</h2>
        <p className="text-muted-foreground">Check back soon for exciting spin-to-win opportunities!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Spin & Win!
          </h1>
          <p className="text-muted-foreground mt-2">Try your luck and win amazing prizes</p>
        </div>

        {/* Points Display */}
        <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-200 rounded-full">
                  <Coins className="h-6 w-6 text-yellow-700" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Points Balance</p>
                  <p className="text-2xl font-bold">{pointsBalance.toLocaleString()}</p>
                </div>
              </div>
              {allocation && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Free Spins Remaining</p>
                  <p className="text-xl font-bold">
                    {allocation.free_spins_remaining_today} / {allocation.free_spins_remaining_total}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {allocation.free_spins_remaining_today} left today
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Selector */}
        {games.length > 1 && (
          <Tabs defaultValue={games[0].id} className="mb-8">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${games.length}, 1fr)` }}>
              {games.map((game) => (
                <TabsTrigger
                  key={game.id}
                  value={game.id}
                  onClick={() => setSelectedGame(game)}
                  className="flex items-center gap-2"
                >
                  {getGameIcon(game.game_type)}
                  {game.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {selectedGame && allocation && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Wheel Column */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-6">
                    <WheelComponent
                      segments={selectedGame.prize_config.map(p => ({
                        label: p.label,
                        color: p.color,
                        value: p.value,
                      }))}
                      onSpin={async () => {
                        if (allocation.can_spin_free) {
                          await handleSpin('free');
                        } else if (allocation.can_spin_paid) {
                          if (confirm(`Spend ${allocation.points_required_for_paid} points to spin?`)) {
                            await handleSpin('points');
                          }
                        } else {
                          toast.error('No spins available. Earn more points!');
                        }
                      }}
                      isSpinning={spinning}
                    />
                  </div>

                  <div className="text-center space-y-3">
                    {allocation.can_spin_free && (
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-emerald-500"
                        onClick={() => handleSpin('free')}
                        disabled={spinning}
                      >
                        <Gift className="h-5 w-5 mr-2" />
                        Free Spin ({allocation.free_spins_remaining_today} left today)
                      </Button>
                    )}
                    
                    {!allocation.can_spin_free && allocation.can_spin_paid && (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleSpin('points')}
                        disabled={spinning}
                      >
                        <Coins className="h-5 w-5 mr-2" />
                        Spin for {allocation.points_required_for_paid} Points
                      </Button>
                    )}

                    {!allocation.can_spin_free && !allocation.can_spin_paid && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-muted-foreground">
                          No spins remaining. Earn more points by making purchases!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leaderboard / Recent Wins */}
            <div>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Recent Winners
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {recentWins.map((win, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                        <span className="font-medium">{win.profiles?.full_name || 'Anonymous'}</span>
                        <Badge variant="outline">{win.prize_value}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}