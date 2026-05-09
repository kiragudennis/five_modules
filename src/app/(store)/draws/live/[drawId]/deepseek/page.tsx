// src/app/(store)/draws/live/[drawId]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LiveDisplayShell } from '@/components/live/live-display-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { usePolling } from '@/hooks/usePolling';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { DrawsService } from '@/lib/services/draws-service';
import { Gift, Ticket, Users, Timer, Trophy, PartyPopper, Loader2 } from 'lucide-react';

type DrawPhase = 'entry_collection' | 'entries_closed' | 'winner_reveal';

export default function DrawLivePage() {
    const { drawId } = useParams<{ drawId: string }>();
    const { supabase } = useAuth();
    const [draw, setDraw] = useState<any>(null);
    const [tickerItems, setTickerItems] = useState<string[]>([]);
    const [entryStats, setEntryStats] = useState<Record<string, number>>({});
    const [totalEntries, setTotalEntries] = useState(0);
    const [phase, setPhase] = useState<DrawPhase>('entry_collection');
    const [drawing, setDrawing] = useState(false);
    const [winners, setWinners] = useState<any[]>([]);
    const [shufflingNames, setShufflingNames] = useState(false);
    const [finalWinner, setFinalWinner] = useState<any>(null);
    
    const drawsService = new DrawsService();

    const load = async () => {
        // Get draw details
        const { data: drawData } = await supabase
            .from('draws')
            .select('*')
            .eq('id', drawId)
            .single();
        setDraw(drawData);
        
        // Get entry stats
        const stats = await drawsService.getEntryStats(drawId as string);
        setEntryStats(stats);
        
        // Get total entries count
        const { count } = await supabase
            .from('draw_entries')
            .select('id', { count: 'exact', head: true })
            .eq('draw_id', drawId);
        setTotalEntries(count || 0);
        
        // Get ticker
        const ticker = await drawsService.getLiveTicker(drawId as string, 30);
        setTickerItems(ticker.map(t => 
            `${t.user_name} earned ${t.entry_count} entries via ${t.entry_method}`
        ));
        
        // Determine phase
        if (drawData?.status === 'completed' && drawData?.winner_id) {
            setPhase('winner_reveal');
            // Fetch winner details
            const { data: winnerData } = await supabase
                .from('draw_winners')
                .select('*, profiles(full_name, email)')
                .eq('draw_id', drawId)
                .eq('winner_rank', 1)
                .single();
            setFinalWinner(winnerData);
        } else if (drawData?.status === 'closed' || drawData?.status === 'drawing') {
            setPhase('entries_closed');
        } else {
            setPhase('entry_collection');
        }
        
        // Check if we have winners
        const { data: existingWinners } = await supabase
            .from('draw_winners')
            .select('*, profiles(full_name)')
            .eq('draw_id', drawId)
            .order('winner_rank');
        if (existingWinners?.length) {
            setWinners(existingWinners);
        }
    };

    useEffect(() => {
        void load();
    }, [drawId]);

    usePolling(load, { intervalMs: 3000 });
    useSupabaseRealtime({
        supabase,
        channelName: `draw-live-${drawId}`,
        tables: [
            { table: 'draw_entries', filter: `draw_id=eq.${drawId}` },
            { table: 'draw_live_ticker', filter: `draw_id=eq.${drawId}` },
            { table: 'draws', filter: `id=eq.${drawId}` },
        ],
        onEvent: () => void load(),
        enabled: Boolean(drawId),
    });

    const startDraw = async () => {
        setDrawing(true);
        setPhase('entries_closed');
        
        // Brief pause to build tension
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setShufflingNames(true);
        
        // Simulate shuffling for 3 seconds
        const shuffleInterval = setInterval(() => {
            // Random name display during shuffle
            const randomNames = ['Sarah M.', 'John K.', 'Aisha W.', 'Peter O.', 'Mary N.', 'James G.'];
            const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
            setFinalWinner({ profiles: { full_name: randomName } } as any);
        }, 200);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        clearInterval(shuffleInterval);
        
        // Perform actual draw
        const result = await drawsService.performDraw(drawId as string);
        
        // Get winner details
        const { data: winnerData } = await supabase
            .from('draw_winners')
            .select('*, profiles(full_name, email)')
            .eq('draw_id', drawId)
            .eq('winner_rank', 1)
            .single();
        
        setFinalWinner(winnerData);
        setWinners([winnerData, ...(result.winners.slice(1))]);
        setShufflingNames(false);
        setPhase('winner_reveal');
        setDrawing(false);
    };

    const getTotalEntryCount = () => {
        return Object.values(entryStats).reduce((a, b) => a + b, 0);
    };

    return (
        <LiveDisplayShell
            title={draw?.name || 'Lucky Draw'}
            subtitle={
                phase === 'entry_collection' ? 'Entries are open!' :
                phase === 'entries_closed' ? 'Entries closed - Draw starting soon!' :
                '🏆 Winner Revealed! 🏆'
            }
            activeCount={getTotalEntryCount()}
            tickerItems={tickerItems}
        >
            {/* Entry Collection Phase */}
            {phase === 'entry_collection' && (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="pt-6 text-center">
                                <Ticket className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-purple-400">{totalEntries.toLocaleString()}</p>
                                <p className="text-sm text-slate-400">Total Entries</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="pt-6 text-center">
                                <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-blue-400">
                                    {Object.keys(entryStats).length}
                                </p>
                                <p className="text-sm text-slate-400">Entry Methods</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="pt-6 text-center">
                                <Timer className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                                <p className="text-sm font-mono text-yellow-400">
                                    {draw?.draw_time && new Date(draw.draw_time).toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-400">Draw Date</p>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-400 mb-3">Entries by Method</p>
                            <div className="space-y-2">
                                {Object.entries(entryStats).map(([method, count]) => (
                                    <div key={method} className="flex justify-between items-center">
                                        <span className="capitalize text-sm">{method.replace('_', ' ')}</span>
                                        <Badge variant="outline">{count.toLocaleString()} entries</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Entries Closed Phase - Tension Building */}
            {phase === 'entries_closed' && !finalWinner && (
                <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/50 animate-pulse">
                    <CardContent className="py-12 text-center">
                        {drawing ? (
                            <>
                                <Loader2 className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-spin" />
                                <p className="text-2xl font-bold text-purple-400">Drawing in progress...</p>
                                <p className="text-slate-400 mt-2">Randomly selecting winners</p>
                            </>
                        ) : (
                            <>
                                <div className="text-6xl mb-4">⏰</div>
                                <p className="text-2xl font-bold">Entries are closed!</p>
                                <p className="text-slate-400 mt-2">The draw is about to begin</p>
                                <Button
                                    className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600"
                                    onClick={startDraw}
                                >
                                    Start Draw
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Winner Reveal Phase */}
            {phase === 'winner_reveal' && finalWinner && (
                <div className="space-y-4">
                    {/* Grand Prize */}
                    <Card className={`bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 ${shufflingNames ? 'animate-shake' : 'animate-confetti'}`}>
                        <CardContent className="py-8 text-center">
                            {shufflingNames ? (
                                <>
                                    <div className="text-4xl font-mono mb-4 tracking-wider animate-pulse">
                                        {finalWinner.profiles?.full_name || '???'}
                                    </div>
                                    <p className="text-yellow-400">Selecting winner...</p>
                                </>
                            ) : (
                                <>
                                    <PartyPopper className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                                    <p className="text-sm text-yellow-500 uppercase tracking-wider">Grand Prize Winner</p>
                                    <p className="text-4xl font-bold mt-2">{finalWinner.profiles?.full_name}</p>
                                    <p className="text-xl text-purple-400 mt-2">{draw?.prize_name}</p>
                                    <div className="mt-4 flex justify-center gap-4">
                                        <Badge variant="outline" className="text-yellow-500">
                                            🎉 Winner! 🎉
                                        </Badge>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Runner Ups */}
                    {winners.slice(1).length > 0 && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="pt-6">
                                <p className="text-sm text-slate-400 mb-3">Runner Ups</p>
                                <div className="space-y-2">
                                    {winners.slice(1).map((winner, idx) => (
                                        <div key={winner.id} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary">#{winner.winner_rank}</Badge>
                                                <span>{winner.profiles?.full_name}</span>
                                            </div>
                                            <Badge variant="outline">
                                                {winner.prize_name}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.1s infinite;
                }
                @keyframes confetti {
                    0%, 100% { background-position: 0 0, 0 0; }
                    100% { background-position: 100px 100px, 50px 50px; }
                }
                .animate-confetti {
                    background-image: radial-gradient(circle at 20% 30%, yellow 1px, transparent 1px),
                                      radial-gradient(circle at 80% 70%, orange 1px, transparent 1px);
                    background-size: 30px 30px, 20px 20px;
                    animation: confetti 0.5s linear infinite;
                }
            `}</style>
        </LiveDisplayShell>
    );
}