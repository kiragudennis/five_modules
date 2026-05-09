// src/app/(store)/deals/live/[dealId]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LiveDisplayShell } from '@/components/live/live-display-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/context/AuthContext';
import { usePolling } from '@/hooks/usePolling';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { DealsService } from '@/lib/services/deals-service';
import { Zap, Clock, Package, Gift, Eye, Coins, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DealLivePage() {
    const { dealId } = useParams<{ dealId: string }>();
    const { supabase } = useAuth();
    const [deal, setDeal] = useState<any>(null);
    const [status, setStatus] = useState<any>(null);
    const [tickerItems, setTickerItems] = useState<string[]>([]);
    const [adminMode, setAdminMode] = useState(false);
    
    const dealsService = new DealsService();

    const load = async () => {
        // Get deal details
        const { data: dealData } = await supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();
        setDeal(dealData);
        
        // Get status
        const dealStatus = await dealsService.getDealStatus(dealId as string);
        setStatus(dealStatus);
        
        // Get ticker
        const ticker = await dealsService.getLiveTicker(dealId as string, 30);
        setTickerItems(ticker.map(t => `${t.user_name} from ${t.user_location || 'Nairobi'} claimed ${t.quantity}x`));
    };

    useEffect(() => {
        void load();
        // Check if admin (for live controls)
        const isAdmin = localStorage.getItem('admin_mode') === 'true';
        setAdminMode(isAdmin);
    }, [dealId]);

    usePolling(load, { intervalMs: 1000 }); // Update every second for countdown
    useSupabaseRealtime({
        supabase,
        channelName: `deal-live-${dealId}`,
        tables: [
            { table: 'deals', filter: `id=eq.${dealId}` },
            { table: 'deal_claims', filter: `deal_id=eq.${dealId}` },
            { table: 'deal_live_ticker', filter: `deal_id=eq.${dealId}` },
        ],
        onEvent: () => void load(),
        enabled: Boolean(dealId),
    });

    const getTimerColor = () => {
        if (!status) return 'text-white';
        if (status.urgency_level.color === 'red') return 'text-red-500';
        if (status.urgency_level.color === 'yellow') return 'text-yellow-500';
        return 'text-green-500';
    };

    const getStockBarColor = () => {
        if (!status) return 'bg-green-500';
        if (status.stock_percentage > 80) return 'bg-red-500';
        if (status.stock_percentage > 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const handleAdminExtend = async () => {
        await dealsService.extendTimer(dealId as string, 10);
        toast.success('Timer extended by 10 minutes');
        await load();
    };

    const handleAdminAddStock = async () => {
        await dealsService.addStock(dealId as string, 20);
        toast.success('Added 20 units');
        await load();
    };

    const handleAdminRevealMystery = async () => {
        const result = await dealsService.revealMysteryDeal(dealId as string);
        toast.success(`Revealed: ${result.product_name} at KES ${result.price}`);
        await load();
    };

    return (
        <LiveDisplayShell
            title={deal?.name || 'Live Deal'}
            subtitle={status?.is_active ? `🔥 LIVE NOW - ${status.urgency_level.message}` : 'Deal Ended'}
            activeCount={tickerItems.length}
            tickerItems={tickerItems}
        >
            <div className="space-y-4">
                {/* Main Deal Card */}
                <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            {/* Deal Type Badge */}
                            <Badge className="mb-3 bg-gradient-to-r from-orange-500 to-red-500">
                                {deal?.deal_type === 'flash_sale' && <Zap className="h-3 w-3 mr-1" />}
                                {deal?.deal_type === 'mystery' && <Eye className="h-3 w-3 mr-1" />}
                                {deal?.deal_type?.toUpperCase()}
                            </Badge>
                            
                            {/* Title */}
                            <h2 className="text-2xl font-bold mb-2">{deal?.name}</h2>
                            <p className="text-slate-400 text-sm mb-4">{deal?.description}</p>
                            
                            {/* Timer */}
                            <div className="mb-4">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Clock className={`h-5 w-5 ${getTimerColor()}`} />
                                    <span className={`text-sm ${getTimerColor()}`}>
                                        {status?.urgency_level.message}
                                    </span>
                                </div>
                                <div className={`text-5xl font-mono font-bold ${getTimerColor()}`}>
                                    {status?.time_remaining_formatted}
                                </div>
                            </div>
                            
                            {/* Stock Meter */}
                            {status?.stock_remaining !== null && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-slate-400 mb-1">
                                        <span>Stock remaining</span>
                                        <span className={status.stock_remaining < 10 ? 'text-red-500 font-bold' : ''}>
                                            {status.stock_remaining} / {deal?.total_quantity}
                                        </span>
                                    </div>
                                    <Progress 
                                        value={status.stock_percentage} 
                                        className="h-3"
                                        indicatorClassName={getStockBarColor()}
                                    />
                                    {status.stock_remaining < 10 && status.stock_remaining > 0 && (
                                        <div className="flex items-center justify-center gap-1 mt-2 text-red-500 animate-pulse">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm font-bold">ALMOST GONE!</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Deal Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="pt-4 text-center">
                            <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-green-500">
                                {deal?.discount_type === 'percentage' ? `${deal?.discount_value}%` : `KES ${deal?.discount_value?.toLocaleString()}`}
                            </p>
                            <p className="text-xs text-slate-400">Savings</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="pt-4 text-center">
                            <Package className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-blue-500">
                                {status?.stock_remaining !== null ? `${(deal?.total_quantity - status.stock_remaining)}/${deal?.total_quantity}` : '∞'}
                            </p>
                            <p className="text-xs text-slate-400">Claimed</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="pt-4 text-center">
                            <Coins className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-yellow-500">
                                +{deal?.bonus_points_per_purchase || 0}
                            </p>
                            <p className="text-xs text-slate-400">Points Bonus</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Admin Live Controls */}
                {adminMode && deal?.status === 'active' && (
                    <Card className="bg-slate-900 border-yellow-500/50">
                        <CardContent className="pt-4">
                            <p className="text-sm text-yellow-500 mb-3 font-bold">Admin Live Controls</p>
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={handleAdminExtend}>
                                    <Clock className="h-3 w-3 mr-1" />
                                    +10 min
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleAdminAddStock}>
                                    <Package className="h-3 w-3 mr-1" />
                                    +20 stock
                                </Button>
                                {deal?.deal_type === 'mystery' && !deal?.mystery_config?.revealed_at && (
                                    <Button size="sm" variant="outline" onClick={handleAdminRevealMystery}>
                                        <Eye className="h-3 w-3 mr-1" />
                                        Reveal Mystery
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Mystery Deal Hidden State */}
                {deal?.deal_type === 'mystery' && !deal?.mystery_config?.revealed_at && (
                    <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/50 animate-pulse">
                        <CardContent className="pt-6 text-center">
                            <Eye className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                            <p className="text-xl font-bold text-purple-400">??? MYSTERY DEAL ???</p>
                            <p className="text-sm text-slate-400 mt-2">Product and price hidden until host reveals live!</p>
                            <div className="mt-4 p-3 bg-purple-500/20 rounded">
                                <p className="text-xs text-purple-300">Value: KES {deal?.mystery_config?.hidden_price?.toLocaleString()}+</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </LiveDisplayShell>
    );
}