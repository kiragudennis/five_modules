// src/app/(admin)/admin/marketing/challenges/page.tsx

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
import { Plus, Pencil, Trash2, Eye, Trophy, Users, Calendar, TrendingUp, Play, Pause, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { Challenge } from '@/types/challenges';

export default function ChallengesAdmin() {
    const { supabase } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        fetchChallenges();
    }, []);

    const fetchChallenges = async () => {
        const { data } = await supabase
            .from('challenges')
            .select('*')
            .order('created_at', { ascending: false });
        setChallenges(data || []);
        setLoading(false);
    };

    const updateChallengeStatus = async (id: string, status: string) => {
        await supabase
            .from('challenges')
            .update({ status })
            .eq('id', id);
        toast.success(`Challenge ${status}`);
        await fetchChallenges();
    };

    const deleteChallenge = async (id: string) => {
        if (confirm('Delete this challenge?')) {
            await supabase.from('challenges').delete().eq('id', id);
            toast.success('Challenge deleted');
            await fetchChallenges();
        }
    };

    const getStatusBadge = (status: string) => {
        const config = {
            draft: { label: 'Draft', variant: 'secondary' as const },
            active: { label: 'Active', variant: 'default' as const },
            paused: { label: 'Paused', variant: 'warning' as const },
            ended: { label: 'Ended', variant: 'destructive' as const },
            archived: { label: 'Archived', variant: 'outline' as const }
        };
        const c = config[status as keyof typeof config];
        return <Badge variant={c.variant}>{c.label}</Badge>;
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Challenges</h1>
                    <p className="text-muted-foreground">Create competitions that drive engagement</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setSelectedChallenge(null)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Challenge
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedChallenge ? 'Edit Challenge' : 'Create Challenge'}</DialogTitle>
                        </DialogHeader>
                        <ChallengeForm initialChallenge={selectedChallenge} onSave={async () => {
                            await fetchChallenges();
                            setDialogOpen(false);
                        }} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {challenges.map((challenge) => (
                    <Card key={challenge.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2">
                                        {challenge.name}
                                        {getStatusBadge(challenge.status)}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`/challenges/live/${challenge.id}`, '_blank')}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Live View
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedChallenge(challenge);
                                            setDialogOpen(true);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteChallenge(challenge.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Type</p>
                                    <p className="font-medium capitalize">{challenge.challenge_type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Duration</p>
                                    <p className="font-medium text-sm">
                                        {new Date(challenge.starts_at).toLocaleDateString()} - {new Date(challenge.ends_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Prize Tiers</p>
                                    <p className="font-medium">{challenge.prize_tiers.length} ranks</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Teams</p>
                                    <p className="font-medium">{challenge.allow_teams ? 'Allowed' : 'Individual only'}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 mt-6">
                                {challenge.status === 'draft' && (
                                    <Button size="sm" onClick={() => updateChallengeStatus(challenge.id, 'active')}>
                                        <Play className="h-4 w-4 mr-2" />
                                        Activate
                                    </Button>
                                )}
                                {challenge.status === 'active' && (
                                    <Button size="sm" variant="outline" onClick={() => updateChallengeStatus(challenge.id, 'paused')}>
                                        <Pause className="h-4 w-4 mr-2" />
                                        Pause
                                    </Button>
                                )}
                                {challenge.status === 'paused' && (
                                    <Button size="sm" onClick={() => updateChallengeStatus(challenge.id, 'active')}>
                                        <Play className="h-4 w-4 mr-2" />
                                        Resume
                                    </Button>
                                )}
                                {(challenge.status === 'active' || challenge.status === 'paused') && (
                                    <Button size="sm" variant="destructive" onClick={() => updateChallengeStatus(challenge.id, 'ended')}>
                                        <Flag className="h-4 w-4 mr-2" />
                                        End Early
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// Challenge Form Component
function ChallengeForm({ initialChallenge, onSave }: { initialChallenge: Challenge | null; onSave: () => void }) {
    const { supabase } = useAuth();
    const [formData, setFormData] = useState<any>(initialChallenge || {
        name: '',
        slug: '',
        description: '',
        challenge_type: 'purchase',
        scoring_config: { points_per_ksh: 1, min_spend: 0 },
        prize_tiers: [
            { rank: 1, prize_type: 'points', prize_value: 5000, badge: 'champion' },
            { rank: 2, prize_type: 'points', prize_value: 2500 },
            { rank: 3, prize_type: 'discount', prize_value: 20 }
        ],
        starts_at: new Date().toISOString().slice(0, 16),
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        status: 'draft',
        allow_teams: false,
        max_team_size: 5,
        allow_team_switching: false,
        streak_reset_on_miss: true,
        streak_grace_days: 0,
        theme_color: '#3B82F6',
        show_leaderboard: true,
        show_ticker: true
    });

    const updateScoringConfig = (key: string, value: any) => {
        setFormData({
            ...formData,
            scoring_config: { ...formData.scoring_config, [key]: value }
        });
    };

    const addPrizeTier = () => {
        const newRank = formData.prize_tiers.length + 1;
        setFormData({
            ...formData,
            prize_tiers: [
                ...formData.prize_tiers,
                { rank: newRank, prize_type: 'points', prize_value: 1000 }
            ]
        });
    };

    const removePrizeTier = (index: number) => {
        const newTiers = formData.prize_tiers.filter((_: any, i: number) => i !== index);
        // Re-number ranks
        newTiers.forEach((tier: any, idx: number) => tier.rank = idx + 1);
        setFormData({ ...formData, prize_tiers: newTiers });
    };

    const updatePrizeTier = (index: number, field: string, value: any) => {
        const newTiers = [...formData.prize_tiers];
        newTiers[index][field] = value;
        setFormData({ ...formData, prize_tiers: newTiers });
    };

    const handleSubmit = async () => {
        const { error } = await supabase
            .from('challenges')
            .upsert(formData)
            .select();
        
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Challenge saved');
            onSave();
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Challenge Name</Label>
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

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Challenge Type</Label>
                    <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={formData.challenge_type}
                        onChange={(e) => setFormData({ ...formData, challenge_type: e.target.value })}
                    >
                        <option value="referral">Referral Challenge</option>
                        <option value="purchase">Purchase Challenge</option>
                        <option value="share">Social Share Challenge</option>
                        <option value="streak">Daily Streak Challenge</option>
                        <option value="team">Team Challenge</option>
                        <option value="combo">Combo Challenge</option>
                        <option value="social">Social Hashtag Challenge</option>
                    </select>
                </div>
                <div>
                    <Label>Status</Label>
                    <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Type-specific scoring config */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Scoring Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    {formData.challenge_type === 'purchase' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Points per KSH spent</Label>
                                <Input
                                    type="number"
                                    value={formData.scoring_config.points_per_ksh}
                                    onChange={(e) => updateScoringConfig('points_per_ksh', parseFloat(e.target.value))}
                                />
                            </div>
                            <div>
                                <Label>Minimum spend to qualify</Label>
                                <Input
                                    type="number"
                                    value={formData.scoring_config.min_spend}
                                    onChange={(e) => updateScoringConfig('min_spend', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    )}
                    
                    {formData.challenge_type === 'referral' && (
                        <div>
                            <Label>Points per successful referral</Label>
                            <Input
                                type="number"
                                value={formData.scoring_config.points_per_referral}
                                onChange={(e) => updateScoringConfig('points_per_referral', parseInt(e.target.value))}
                            />
                        </div>
                    )}
                    
                    {formData.challenge_type === 'streak' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Points per consecutive day</Label>
                                    <Input
                                        type="number"
                                        value={formData.scoring_config.points_per_day}
                                        onChange={(e) => updateScoringConfig('points_per_day', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label>Days required for full streak</Label>
                                    <Input
                                        type="number"
                                        value={formData.scoring_config.days_required}
                                        onChange={(e) => updateScoringConfig('days_required', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.streak_reset_on_miss}
                                        onChange={(e) => setFormData({ ...formData, streak_reset_on_miss: e.target.checked })}
                                    />
                                    Reset streak on missed day
                                </Label>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Prize Tiers */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Prize Tiers</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addPrizeTier}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Tier
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {formData.prize_tiers.map((tier: any, idx: number) => (
                            <div key={idx} className="flex gap-3 items-center">
                                <div className="w-16">
                                    <Label className="text-sm">Rank {tier.rank}</Label>
                                </div>
                                <select
                                    value={tier.prize_type}
                                    onChange={(e) => updatePrizeTier(idx, 'prize_type', e.target.value)}
                                    className="rounded-md border px-2 py-1"
                                >
                                    <option value="points">Points</option>
                                    <option value="discount">Discount %</option>
                                    <option value="free_shipping">Free Shipping</option>
                                    <option value="product">Product</option>
                                    <option value="bundle">Bundle</option>
                                    <option value="badge">Badge</option>
                                </select>
                                <Input
                                    placeholder="Value"
                                    value={tier.prize_value}
                                    onChange={(e) => updatePrizeTier(idx, 'prize_value', e.target.value)}
                                    className="w-32"
                                />
                                {tier.prize_type === 'badge' && (
                                    <Input
                                        placeholder="Badge name"
                                        value={tier.badge}
                                        onChange={(e) => updatePrizeTier(idx, 'badge', e.target.value)}
                                        className="flex-1"
                                    />
                                )}
                                <Button type="button" variant="ghost" size="sm" onClick={() => removePrizeTier(idx)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button onClick={handleSubmit}>Save Challenge</Button>
            </div>
        </div>
    );
}