// src/app/(store)/deals/[slug]/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, Gift, Coins, ShoppingBag, Eye, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { DealsService } from '@/lib/services/deals-service';
import { Deal, DealStatus } from '@/types/deals';

export default function DealPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { supabase, profile } = useAuth();
    const [deal, setDeal] = useState<Deal | null>(null);
    const [status, setStatus] = useState<DealStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviving, setReviving] = useState(false);
    const [gettingEarlyAccess, setGettingEarlyAccess] = useState(false);
    const [tickerItems, setTickerItems] = useState<any[]>([]);
    
    const dealsService = new DealsService();

    const fetchData = useCallback(async () => {
        if (!slug) return;
        
        const { data: dealData } = await supabase
            .from('deals')
            .select('*')
            .eq('slug', slug)
            .single();
        
        if (dealData) {
            setDeal(dealData);
            const dealStatus = await dealsService.getDealStatus(dealData.id, profile?.id);
            setStatus(dealStatus);
            
            const ticker = await dealsService.getLiveTicker(dealData.id, 20);
            setTickerItems(ticker);
        }
        
        setLoading(false);
    }, [slug, profile?.id, supabase]);

    useEffect(() => {
        fetchData();
        
        // Poll for updates every second (for countdown)
        const interval = setInterval(fetchData, 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleBuyNow = async () => {
        if (!profile) {
            router.push('/login');
            return;
        }
        
        if (!status?.can_claim) {
            toast.error('Cannot claim this deal right now');
            return;
        }
        
        // Redirect to checkout with deal applied
        router.push(`/checkout?deal=${deal?.id}`);
    };

    const handleRevive = async () => {
        if (!profile) return;
        
        setReviving(true);
        try {
            await dealsService.reviveDeal(deal!.id, profile.id);
            toast.success(`Deal revived! You have ${deal?.revive_duration_minutes} minutes to claim it.`);
            await fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setReviving(false);
        }
    };

    const handleEarlyAccess = async () => {
        if (!profile) return;
        
        setGettingEarlyAccess(true);
        try {
            await dealsService.grantEarlyAccess(deal!.id, profile.id);
            toast.success('Early access granted! You can now purchase this deal early.');
            await fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setGettingEarlyAccess(false);
        }
    };

    const getUrgencyColor = () => {
        if (!status) return 'text-gray-600';
        switch (status.urgency_level.color) {
            case 'green': return 'text-green-600';
            case 'yellow': return 'text-yellow-600';
            case 'red': return 'text-red-600 animate-pulse';
            default: return 'text-gray-600';
        }
    };

    if (loading) {
        return <div className="container mx-auto px-4 py-16 text-center">Loading deal...</div>;
    }

    if (!deal) {
        return <div className="container mx-auto px-4 py-16 text-center">Deal not found</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Banner */}
                <div 
                    className="rounded-lg p-6 mb-8 text-center"
                    style={{ backgroundColor: deal.banner_color + '20' }}
                >
                    <Badge className="mb-2" variant="default">
                        {deal.deal_type === 'flash_sale' && <Zap className="h-3 w-3 mr-1" />}
                        {deal.deal_type === 'mystery' && <Eye className="h-3 w-3 mr-1" />}
                        {deal.deal_type.toUpperCase()} DEAL
                    </Badge>
                    <h1 className="text-3xl font-bold mb-2">{deal.name}</h1>
                    <p className="text-muted-foreground">{deal.description}</p>
                </div>

                {/* Countdown Timer */}
                {status && status.is_active && (
                    <Card className="mb-6 border-2" style={{ borderColor: status.urgency_level.color === 'red' ? '#ef4444' : '#e5e7eb' }}>
                        <CardContent className="pt-6 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Clock className={`h-5 w-5 ${getUrgencyColor()}`} />
                                <span className={`font-bold ${getUrgencyColor()}`}>
                                    {status.urgency_level.message}
                                </span>
                            </div>
                            <div className="text-4xl font-mono font-bold">
                                {status.time_remaining_formatted}
                            </div>
                            {status.stock_remaining !== null && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Stock remaining</span>
                                        <span className={status.stock_remaining < 10 ? 'text-red-600 font-bold' : ''}>
                                            {status.stock_remaining} units
                                        </span>
                                    </div>
                                    <Progress value={status.stock_percentage} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Deal Expired / Revival */}
                {!status?.is_active && deal.points_to_revive && (
                    <Card className="mb-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                        <CardContent className="pt-6 text-center">
                            <p className="text-lg mb-2">⏰ This deal has ended</p>
                            <p className="text-sm text-gray-300 mb-4">
                                Spend {deal.points_to_revive} points to revive it for {deal.revive_duration_minutes} minutes
                            </p>
                            <Button
                                onClick={handleRevive}
                                disabled={reviving || !status?.can_revive}
                                variant="default"
                            >
                                <Coins className="h-4 w-4 mr-2" />
                                {reviving ? 'Reviving...' : `Revive for ${deal.points_to_revive} pts`}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Early Access */}
                {deal.points_required_for_early_access && new Date(deal.starts_at) > new Date() && (
                    <Card className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                        <CardContent className="pt-6 text-center">
                            <p className="text-lg mb-2">🚀 Get Early Access</p>
                            <p className="text-sm mb-4">
                                Be the first to claim this deal by spending {deal.points_required_for_early_access} points
                            </p>
                            <Button
                                onClick={handleEarlyAccess}
                                disabled={gettingEarlyAccess}
                                variant="secondary"
                            >
                                <Coins className="h-4 w-4 mr-2" />
                                {gettingEarlyAccess ? 'Processing...' : `Get Early Access (${deal.points_required_for_early_access} pts)`}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Main Deal Card */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Product Image */}
                            {deal.featured_image_url && (
                                <div className="rounded-lg overflow-hidden">
                                    <img src={deal.featured_image_url} alt={deal.name} className="w-full h-auto" />
                                </div>
                            )}
                            
                            {/* Deal Details */}
                            <div>
                                {/* Price */}
                                {deal.deal_type === 'discount' && (
                                    <div className="mb-4">
                                        {deal.discount_type === 'percentage' ? (
                                            <div className="text-3xl font-bold text-green-600">
                                                {deal.discount_value}% OFF
                                            </div>
                                        ) : (
                                            <div className="text-3xl font-bold text-green-600">
                                                KES {deal.discount_value?.toLocaleString()} OFF
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {deal.deal_type === 'bogo' && deal.bogo_config && (
                                    <div className="mb-4 p-3 bg-green-100 rounded-lg">
                                        <p className="text-lg font-bold text-green-700">
                                            Buy {deal.bogo_config.buy_quantity}, Get {deal.bogo_config.get_quantity} {deal.bogo_config.get_discount_percent === 100 ? 'FREE' : `at ${deal.bogo_config.get_discount_percent}% OFF`}
                                        </p>
                                    </div>
                                )}
                                
                                {deal.deal_type === 'free_gift' && deal.free_gift_config && (
                                    <div className="mb-4 p-3 bg-purple-100 rounded-lg">
                                        <Gift className="h-5 w-5 text-purple-600 inline mr-2" />
                                        <span className="font-bold">Free gift on orders over KES {deal.free_gift_config.min_purchase_amount?.toLocaleString()}</span>
                                    </div>
                                )}
                                
                                {/* Points Bonus */}
                                {deal.bonus_points_per_purchase > 0 && (
                                    <div className="mb-4 flex items-center gap-2 text-sm text-yellow-600">
                                        <Coins className="h-4 w-4" />
                                        <span>Earn {deal.bonus_points_per_purchase} bonus points on purchase!</span>
                                    </div>
                                )}
                                
                                {/* Claim Limit */}
                                {status && (
                                    <div className="mb-4 text-sm text-muted-foreground">
                                        {status.user_claims_count} / {deal.per_user_limit} claimed per user
                                    </div>
                                )}
                                
                                {/* Action Button */}
                                <Button
                                    size="lg"
                                    className="w-full"
                                    disabled={!status?.can_claim}
                                    onClick={handleBuyNow}
                                >
                                    {!status?.can_claim ? (
                                        status?.user_claims_count >= deal.per_user_limit ? 'Limit Reached' : 'Deal Unavailable'
                                    ) : (
                                        <>
                                            <ShoppingBag className="h-5 w-5 mr-2" />
                                            Claim Deal Now
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Live Claim Ticker */}
                {deal.show_claim_ticker && tickerItems.length > 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Recent Claims</p>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {tickerItems.map((item, idx) => (
                                    <div key={idx} className="text-sm text-muted-foreground">
                                        🎉 {item.user_name} claimed {item.quantity}x
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}