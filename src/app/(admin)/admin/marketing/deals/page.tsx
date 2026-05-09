// src/app/(admin)/admin/marketing/deals/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye, Zap, Gift, Package, Ticket, TrendingUp, Clock, Users, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { Deal, BogoConfig, FreeGiftConfig, MysteryConfig } from '@/types/deals';
import { DealsService } from '@/lib/services/deals-service';

export default function DealsAdmin() {
    const { supabase } = useAuth();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    const dealsService = new DealsService();

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        const { data } = await supabase
            .from('deals')
            .select('*')
            .order('created_at', { ascending: false });
        setDeals(data || []);
        setLoading(false);
    };

    const updateDealStatus = async (id: string, status: string) => {
        await supabase
            .from('deals')
            .update({ status })
            .eq('id', id);
        toast.success(`Deal ${status}`);
        await fetchDeals();
    };

    const deleteDeal = async (id: string) => {
        if (confirm('Delete this deal?')) {
            await supabase.from('deals').delete().eq('id', id);
            toast.success('Deal deleted');
            await fetchDeals();
        }
    };

    const triggerFlashSale = async (id: string) => {
        await dealsService.triggerFlashSale(id);
        toast.success('Flash sale activated!');
        await fetchDeals();
    };

    const getStatusBadge = (status: string, deal: Deal) => {
        const now = new Date();
        const start = new Date(deal.starts_at);
        const end = new Date(deal.ends_at);
        
        if (status === 'active') {
            if (now < start) return <Badge variant="warning">Scheduled</Badge>;
            if (now > end) return <Badge variant="secondary">Expired</Badge>;
            return <Badge variant="default" className="bg-green-500">Active</Badge>;
        }
        
        const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            draft: { label: 'Draft', variant: 'secondary' },
            scheduled: { label: 'Scheduled', variant: 'warning' as any },
            paused: { label: 'Paused', variant: 'destructive' },
            ended: { label: 'Ended', variant: 'outline' },
            cancelled: { label: 'Cancelled', variant: 'destructive' }
        };
        const c = config[status] || config.draft;
        return <Badge variant={c.variant}>{c.label}</Badge>;
    };

    const getDealTypeIcon = (type: string) => {
        switch (type) {
            case 'discount': return <TrendingUp className="h-4 w-4" />;
            case 'bogo': return <Package className="h-4 w-4" />;
            case 'free_gift': return <Gift className="h-4 w-4" />;
            case 'mystery': return <Ticket className="h-4 w-4" />;
            case 'flash_sale': return <Zap className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Deals & Giveaways</h1>
                    <p className="text-muted-foreground">Manage flash sales, BOGO offers, and daily deals</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setSelectedDeal(null)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Deal
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedDeal ? 'Edit Deal' : 'Create Deal'}</DialogTitle>
                        </DialogHeader>
                        <DealForm initialDeal={selectedDeal} onSave={async () => {
                            await fetchDeals();
                            setDialogOpen(false);
                        }} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map((deal) => (
                    <Card key={deal.id} className="relative overflow-hidden">
                        {deal.featured_image_url && (
                            <div className="h-32 overflow-hidden">
                                <img src={deal.featured_image_url} alt={deal.name} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2">
                                        {getDealTypeIcon(deal.deal_type)}
                                        {deal.name}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {deal.description}
                                    </p>
                                </div>
                                {getStatusBadge(deal.status, deal)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Deal-specific info */}
                            {deal.deal_type === 'discount' && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Discount:</span>
                                    <span className="font-bold text-green-600">
                                        {deal.discount_type === 'percentage' ? `${deal.discount_value}% OFF` : `KES ${deal.discount_value} OFF`}
                                    </span>
                                </div>
                            )}
                            
                            {deal.deal_type === 'bogo' && deal.bogo_config && (
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Buy {deal.bogo_config.buy_quantity}, </span>
                                    <span className="font-bold">Get {deal.bogo_config.get_quantity} FREE</span>
                                </div>
                            )}
                            
                            {deal.deal_type === 'free_gift' && deal.free_gift_config && (
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Free gift on orders over </span>
                                    <span className="font-bold">KES {deal.free_gift_config.min_purchase_amount?.toLocaleString()}</span>
                                </div>
                            )}
                            
                            {deal.deal_type === 'flash_sale' && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Stock:</span>
                                    <span className={deal.remaining_quantity === 0 ? 'text-red-600' : ''}>
                                        {deal.remaining_quantity} / {deal.total_quantity} left
                                    </span>
                                </div>
                            )}

                            {/* Timing */}
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Starts:</span>
                                    <span>{new Date(deal.starts_at).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ends:</span>
                                    <span>{new Date(deal.ends_at).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Points Integration */}
                            <div className="flex flex-wrap gap-2">
                                {deal.bonus_points_per_purchase > 0 && (
                                    <Badge variant="outline" className="gap-1">
                                        <Coins className="h-3 w-3" />
                                        +{deal.bonus_points_per_purchase} pts
                                    </Badge>
                                )}
                                {deal.points_required_for_early_access && (
                                    <Badge variant="outline" className="gap-1">
                                        Early access: {deal.points_required_for_early_access} pts
                                    </Badge>
                                )}
                                {deal.points_to_revive && (
                                    <Badge variant="outline" className="gap-1">
                                        Revive: {deal.points_to_revive} pts
                                    </Badge>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => window.open(`/deals/live/${deal.id}`, '_blank')}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Live View
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedDeal(deal);
                                        setDialogOpen(true);
                                    }}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteDeal(deal.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Quick Actions */}
                            {deal.status === 'draft' && deal.deal_type === 'flash_sale' && (
                                <Button
                                    size="sm"
                                    className="w-full bg-gradient-to-r from-orange-500 to-red-500"
                                    onClick={() => triggerFlashSale(deal.id)}
                                >
                                    <Zap className="h-4 w-4 mr-2" />
                                    Launch Flash Sale Now
                                </Button>
                            )}
                            
                            {deal.status === 'scheduled' && (
                                <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => updateDealStatus(deal.id, 'active')}
                                >
                                    Activate Early
                                </Button>
                            )}
                            
                            {deal.status === 'active' && (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => updateDealStatus(deal.id, 'paused')}
                                >
                                    Pause Deal
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// Deal Form Component
function DealForm({ initialDeal, onSave }: { initialDeal: Deal | null; onSave: () => void }) {
    const { supabase } = useAuth();
    const [dealType, setDealType] = useState(initialDeal?.deal_type || 'discount');
    const [formData, setFormData] = useState<any>(initialDeal || {
        name: '',
        slug: '',
        description: '',
        deal_type: 'discount',
        product_id: null,
        discount_type: 'percentage',
        discount_value: 20,
        total_quantity: null,
        remaining_quantity: null,
        per_user_limit: 1,
        starts_at: new Date().toISOString().slice(0, 16),
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        status: 'draft',
        bonus_points_per_purchase: 0,
        points_required_for_early_access: null,
        points_to_revive: null,
        revive_duration_minutes: 10,
        show_countdown: true,
        show_stock_counter: true,
        show_claim_ticker: true,
        banner_color: '#3B82F6'
    });

    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('id, name, price')
            .limit(100);
        setProducts(data || []);
    };

    const handleSubmit = async () => {
        const { error } = await supabase
            .from('deals')
            .upsert({
                ...formData,
                deal_type: dealType
            })
            .select();
        
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Deal saved');
            onSave();
        }
    };

    return (
        <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Deal Name</Label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <Label>Slug</Label>
                    <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    />
                </div>
            </div>

            <div>
                <Label>Description</Label>
                <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            {/* Deal Type */}
            <div>
                <Label>Deal Type</Label>
                <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={dealType}
                    onChange={(e) => setDealType(e.target.value as any)}
                >
                    <option value="discount">Discount (Percentage/Fixed)</option>
                    <option value="bogo">Buy One Get One (BOGO)</option>
                    <option value="free_gift">Free Gift with Purchase</option>
                    <option value="mystery">Mystery Deal</option>
                    <option value="flash_sale">Flash Sale</option>
                    <option value="daily_deal">Daily Deal</option>
                </select>
            </div>

            {/* Product Selection */}
            <div>
                <Label>Product</Label>
                <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={formData.product_id || ''}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value || null })}
                >
                    <option value="">Select a product</option>
                    {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - KES {p.price}</option>
                    ))}
                </select>
            </div>

            {/* Type-specific configuration */}
            {dealType === 'discount' && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Discount Type</Label>
                        <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                            value={formData.discount_type}
                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (KES)</option>
                        </select>
                    </div>
                    <div>
                        <Label>Discount Value</Label>
                        <Input
                            type="number"
                            value={formData.discount_value}
                            onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>
            )}

            {dealType === 'bogo' && (
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label>Buy Quantity</Label>
                        <Input
                            type="number"
                            value={formData.bogo_config?.buy_quantity || 1}
                            onChange={(e) => setFormData({
                                ...formData,
                                bogo_config: { ...formData.bogo_config, buy_quantity: parseInt(e.target.value) }
                            })}
                        />
                    </div>
                    <div>
                        <Label>Get Quantity</Label>
                        <Input
                            type="number"
                            value={formData.bogo_config?.get_quantity || 1}
                            onChange={(e) => setFormData({
                                ...formData,
                                bogo_config: { ...formData.bogo_config, get_quantity: parseInt(e.target.value) }
                            })}
                        />
                    </div>
                    <div>
                        <Label>Discount % on Get</Label>
                        <Input
                            type="number"
                            value={formData.bogo_config?.get_discount_percent || 100}
                            onChange={(e) => setFormData({
                                ...formData,
                                bogo_config: { ...formData.bogo_config, get_discount_percent: parseInt(e.target.value) }
                            })}
                        />
                    </div>
                </div>
            )}

            {/* Inventory Limits */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Total Quantity (optional)</Label>
                    <Input
                        type="number"
                        value={formData.total_quantity || ''}
                        onChange={(e) => setFormData({
                            ...formData,
                            total_quantity: e.target.value ? parseInt(e.target.value) : null,
                            remaining_quantity: e.target.value ? parseInt(e.target.value) : null
                        })}
                    />
                </div>
                <div>
                    <Label>Per User Limit</Label>
                    <Input
                        type="number"
                        value={formData.per_user_limit}
                        onChange={(e) => setFormData({ ...formData, per_user_limit: parseInt(e.target.value) })}
                    />
                </div>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Starts At</Label>
                    <Input
                        type="datetime-local"
                        value={formData.starts_at}
                        onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    />
                </div>
                <div>
                    <Label>Ends At</Label>
                    <Input
                        type="datetime-local"
                        value={formData.ends_at}
                        onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    />
                </div>
            </div>

            {/* Points Integration */}
            <div className="space-y-4 border-t pt-4">
                <Label className="text-lg font-semibold">Points Integration</Label>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label>Bonus Points per Purchase</Label>
                        <Input
                            type="number"
                            value={formData.bonus_points_per_purchase}
                            onChange={(e) => setFormData({ ...formData, bonus_points_per_purchase: parseInt(e.target.value) })}
                        />
                    </div>
                    <div>
                        <Label>Early Access Cost (points)</Label>
                        <Input
                            type="number"
                            value={formData.points_required_for_early_access || ''}
                            onChange={(e) => setFormData({ ...formData, points_required_for_early_access: e.target.value ? parseInt(e.target.value) : null })}
                        />
                    </div>
                    <div>
                        <Label>Revive Cost (points)</Label>
                        <Input
                            type="number"
                            value={formData.points_to_revive || ''}
                            onChange={(e) => setFormData({ ...formData, points_to_revive: e.target.value ? parseInt(e.target.value) : null })}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button onClick={handleSubmit}>Save Deal</Button>
            </div>
        </div>
    );
}