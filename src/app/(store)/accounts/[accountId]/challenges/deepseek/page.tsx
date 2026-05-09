// src/app/(store)/accounts/[accountId]/challenges/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Users, Flame, TrendingUp, Share2, Gift, Coins, ChevronRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ChallengesService } from '@/lib/services/challenges-service';
import { Challenge, ChallengeParticipant } from '@/types/challenges';

export default function ChallengesPage() {
    const { accountId } = useParams();
    const router = useRouter();
    const { profile, supabase } = useAuth();
    const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
    const [myChallenges, setMyChallenges] = useState<(Challenge & { participant: ChallengeParticipant })[]>([]);
    const [loading, setLoading] = useState(true);
    
    const challengesService = new ChallengesService();

    useEffect(() => {
        if (!profile || profile.id !== accountId) {
            router.push('/login');
            return;
        }
        fetchData();
    }, [accountId, profile]);

    const fetchData = async () => {
        try {
            const [available, joined] = await Promise.all([
                challengesService.getActiveChallenges(accountId as string),
                challengesService.getUserChallenges(accountId as string)
            ]);
            setActiveChallenges(available);
            setMyChallenges(joined);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load challenges');
        } finally {
            setLoading(false);
        }
    };

    const joinChallenge = async (challengeId: string) => {
        try {
            await challengesService.joinChallenge(challengeId, accountId as string);
            toast.success('Joined challenge!');
            await fetchData();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const getChallengeIcon = (type: string) => {
        switch (type) {
            case 'referral': return <Share2 className="h-5 w-5" />;
            case 'purchase': return <TrendingUp className="h-5 w-5" />;
            case 'streak': return <Flame className="h-5 w-5" />;
            case 'team': return <Users className="h-5 w-5" />;
            default: return <Target className="h-5 w-5" />;
        }
    };

    const getProgressPercentage = (challenge: Challenge, participant: ChallengeParticipant) => {
        // Simple progress based on top prize threshold
        const topPrize = challenge.prize_tiers.find(t => t.rank === 1);
        if (!topPrize) return 0;
        
        const targetPoints = typeof topPrize.prize_value === 'number' ? topPrize.prize_value : 5000;
        return Math.min(100, (participant.current_score / targetPoints) * 100);
    };

    if (loading) {
        return <div className="container mx-auto px-4 py-16 text-center">Loading challenges...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                        Challenges
                    </h1>
                    <p className="text-muted-foreground mt-2">Compete, earn points, win prizes</p>
                </div>

                <Tabs defaultValue="active" className="space-y-6">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                        <TabsTrigger value="active">Active Challenges</TabsTrigger>
                        <TabsTrigger value="my">My Challenges</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="space-y-4">
                        {activeChallenges.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No active challenges right now</p>
                                </CardContent>
                            </Card>
                        ) : (
                            activeChallenges.map((challenge) => (
                                <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex flex-wrap justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {getChallengeIcon(challenge.challenge_type)}
                                                    <h3 className="text-xl font-bold">{challenge.name}</h3>
                                                    <Badge variant="outline" className="capitalize">
                                                        {challenge.challenge_type}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground text-sm mb-3">{challenge.description}</p>
                                                
                                                <div className="flex gap-4 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Ends:</span>
                                                        <span className="ml-1 font-medium">
                                                            {new Date(challenge.ends_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Prizes:</span>
                                                        <span className="ml-1 font-medium">
                                                            Top {challenge.prize_tiers.length} winners
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 mt-4">
                                                    {challenge.prize_tiers.slice(0, 3).map((tier, idx) => (
                                                        <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                                                            <Trophy className="h-3 w-3" />
                                                            {tier.rank === 1 && '🥇'}
                                                            {tier.rank === 2 && '🥈'}
                                                            {tier.rank === 3 && '🥉'}
                                                            {tier.prize_type === 'points' && `${tier.prize_value} pts`}
                                                            {tier.prize_type === 'discount' && `${tier.prize_value}% off`}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <Button onClick={() => joinChallenge(challenge.id)}>
                                                Join Challenge
                                                <ChevronRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="my" className="space-y-4">
                        {myChallenges.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">You haven't joined any challenges yet</p>
                                    <Button variant="link" onClick={() => document.querySelector('[value="active"]')?.dispatchEvent(new Event('click'))}>
                                        Browse Active Challenges
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            myChallenges.map(({ challenge, participant }) => (
                                <Card key={challenge.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/accounts/${accountId}/challenges/${challenge.id}`)}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    {getChallengeIcon(challenge.challenge_type)}
                                                    <h3 className="text-lg font-bold">{challenge.name}</h3>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{challenge.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-primary">{participant.current_score}</p>
                                                <p className="text-xs text-muted-foreground">points</p>
                                            </div>
                                        </div>
                                        
                                        <Progress value={getProgressPercentage(challenge, participant)} className="mb-2" />
                                        
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <div className="flex items-center gap-4">
                                                <span>Rank: #{participant.current_rank || '—'}</span>
                                                {challenge.challenge_type === 'streak' && (
                                                    <span className="flex items-center gap-1">
                                                        <Flame className="h-3 w-3 text-orange-500" />
                                                        Streak: {participant.current_streak} days
                                                    </span>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="sm" className="gap-1">
                                                View Leaderboard
                                                <Eye className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}