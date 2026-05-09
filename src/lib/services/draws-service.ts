// src/lib/services/draws-service.ts

import { createClient } from '@/lib/supabase/server';
import { Draw, DrawEntry, UserDrawStatus, EntryConfig } from '@/types/draws';
import { PointsService } from './points-service';

export class DrawsService {
    private supabase = createClient();
    private pointsService = new PointsService();

    /**
     * Get all open draws
     */
    async getOpenDraws(userId?: string): Promise<Draw[]> {
        const now = new Date().toISOString();
        
        let query = this.supabase
            .from('draws')
            .select('*')
            .eq('status', 'open')
            .lte('entry_starts_at', now)
            .gte('entry_ends_at', now)
            .order('draw_time', { ascending: true });
        
        const { data, error } = await query;
        if (error) throw error;
        
        // If userId provided, augment with user's entry count
        if (userId && data) {
            for (const draw of data) {
                const { count } = await this.supabase
                    .from('draw_entries')
                    .select('id', { count: 'exact', head: true })
                    .eq('draw_id', draw.id)
                    .eq('user_id', userId);
                
                (draw as any).user_entry_count = count || 0;
            }
        }
        
        return data || [];
    }

    /**
     * Get draw by ID with user entry status
     */
    async getDraw(drawId: string, userId?: string): Promise<Draw & { userEntries?: number; userTickets?: number }> {
        const { data: draw, error } = await this.supabase
            .from('draws')
            .select('*')
            .eq('id', drawId)
            .single();
        
        if (error) throw error;
        
        if (userId) {
            const { count: entriesCount } = await this.supabase
                .from('draw_entries')
                .select('id', { count: 'exact', head: true })
                .eq('draw_id', drawId)
                .eq('user_id', userId);
            
            const { count: ticketsCount } = await this.supabase
                .from('draw_tickets')
                .select('id', { count: 'exact', head: true })
                .eq('draw_id', drawId)
                .eq('user_id', userId);
            
            return {
                ...draw,
                userEntries: entriesCount || 0,
                userTickets: ticketsCount || 0
            };
        }
        
        return draw;
    }

    /**
     * Get user's entry status for a draw
     */
    async getUserDrawStatus(drawId: string, userId: string): Promise<UserDrawStatus> {
        const { data: entries } = await this.supabase
            .from('draw_entries')
            .select('entry_count, entry_method')
            .eq('draw_id', drawId)
            .eq('user_id', userId);
        
        const totalEntries = entries?.reduce((sum, e) => sum + e.entry_count, 0) || 0;
        
        const entryMethodsUsed: Record<string, number> = {};
        entries?.forEach(e => {
            entryMethodsUsed[e.entry_method] = (entryMethodsUsed[e.entry_method] || 0) + e.entry_count;
        });
        
        const { data: draw } = await this.supabase
            .from('draws')
            .select('max_entries_per_user')
            .eq('id', drawId)
            .single();
        
        const remainingAllowed = draw?.max_entries_per_user 
            ? Math.max(0, draw.max_entries_per_user - totalEntries)
            : null;
        
        // Check eligibility for different entry methods
        const { data: orders } = await this.supabase
            .from('orders')
            .select('total_amount')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('created_at', draw?.entry_starts_at || '2000-01-01');
        
        const totalSpent = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        
        return {
            total_entries: totalEntries,
            remaining_entries_allowed: remainingAllowed,
            entry_methods_used: entryMethodsUsed,
            can_enter_purchase: totalSpent > 0,
            can_enter_referral: true, // Always can refer
            can_enter_social: true,
            can_enter_live: true
        };
    }

    /**
     * Add purchase-based entries
     */
    async addPurchaseEntries(
        drawId: string,
        userId: string,
        orderId: string,
        orderAmount: number
    ): Promise<number> {
        const { data: draw, error: drawError } = await this.supabase
            .from('draws')
            .select('entry_config, max_entries_per_user, max_entries_total, status')
            .eq('id', drawId)
            .single();
        
        if (drawError) throw drawError;
        if (draw.status !== 'open') throw new Error('Draw is not open for entries');
        
        const config = draw.entry_config as EntryConfig;
        const purchaseConfig = config.purchase;
        
        if (!purchaseConfig) return 0;
        if (orderAmount < (purchaseConfig.min_amount || 0)) return 0;
        
        // Calculate entries based on amount spent
        let entries = Math.floor(orderAmount * (purchaseConfig.entries_per_ksh || 1));
        
        // Check thresholds for bonus entries
        if (purchaseConfig.bonus_at_thresholds) {
            for (const threshold of purchaseConfig.bonus_at_thresholds) {
                if (orderAmount >= threshold.threshold) {
                    entries += threshold.bonus_entries;
                }
            }
        }
        
        // Check per-user limit
        if (draw.max_entries_per_user) {
            const { count: userEntries } = await this.supabase
                .from('draw_entries')
                .select('id', { count: 'exact', head: true })
                .eq('draw_id', drawId)
                .eq('user_id', userId);
            
            const remaining = draw.max_entries_per_user - (userEntries || 0);
            entries = Math.min(entries, remaining);
        }
        
        // Check global limit
        if (draw.max_entries_total) {
            const { count: totalEntries } = await this.supabase
                .from('draw_entries')
                .select('id', { count: 'exact', head: true })
                .eq('draw_id', drawId);
            
            const remainingGlobal = draw.max_entries_total - (totalEntries || 0);
            entries = Math.min(entries, remainingGlobal);
        }
        
        if (entries <= 0) return 0;
        
        // Record entries
        const { data: entry, error: entryError } = await this.supabase
            .from('draw_entries')
            .insert({
                draw_id: drawId,
                user_id: userId,
                entry_count: entries,
                entry_method: 'purchase',
                source_id: orderId,
                metadata: { order_amount: orderAmount }
            })
            .select()
            .single();
        
        if (entryError) throw entryError;
        
        // Create individual tickets
        await this.createTickets(drawId, userId, entry.id, entries);
        
        // Add to live ticker
        const { data: profile } = await this.supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();
        
        await this.supabase
            .from('draw_live_ticker')
            .insert({
                draw_id: drawId,
                user_name: profile?.full_name || 'Customer',
                entry_count: entries,
                entry_method: 'purchase'
            });
        
        return entries;
    }

    /**
     * Add referral-based entries
     */
    async addReferralEntries(
        drawId: string,
        userId: string,
        referralId: string
    ): Promise<number> {
        const { data: draw } = await this.supabase
            .from('draws')
            .select('entry_config, status')
            .eq('id', drawId)
            .single();
        
        if (draw?.status !== 'open') return 0;
        
        const config = draw.entry_config as EntryConfig;
        const referralConfig = config.referral;
        
        if (!referralConfig) return 0;
        
        let entries = referralConfig.entries_per_referral;
        
        // Check if first referral
        const { count: existingReferrals } = await this.supabase
            .from('draw_entries')
            .select('id', { count: 'exact', head: true })
            .eq('draw_id', drawId)
            .eq('user_id', userId)
            .eq('entry_method', 'referral');
        
        if (existingReferrals === 0 && referralConfig.bonus_for_first_referral) {
            entries += referralConfig.bonus_for_first_referral;
        }
        
        const { data: entry } = await this.supabase
            .from('draw_entries')
            .insert({
                draw_id: drawId,
                user_id: userId,
                entry_count: entries,
                entry_method: 'referral',
                source_id: referralId
            })
            .select()
            .single();
        
        await this.createTickets(drawId, userId, entry.id, entries);
        
        return entries;
    }

    /**
     * Add social share entries
     */
    async addSocialShareEntries(
        drawId: string,
        userId: string,
        platform: string
    ): Promise<number> {
        const { data: draw } = await this.supabase
            .from('draws')
            .select('entry_config, status')
            .eq('id', drawId)
            .single();
        
        if (draw?.status !== 'open') return 0;
        
        const config = draw.entry_config as EntryConfig;
        const socialConfig = config.social_share;
        
        if (!socialConfig) return 0;
        
        // Check daily limit
        if (socialConfig.max_entries_per_day) {
            const today = new Date().toISOString().split('T')[0];
            const { count: todayShares } = await this.supabase
                .from('draw_entries')
                .select('id', { count: 'exact', head: true })
                .eq('draw_id', drawId)
                .eq('user_id', userId)
                .eq('entry_method', 'social_share')
                .gte('created_at', `${today}T00:00:00`)
                .lt('created_at', `${today}T23:59:59`);
            
            if (todayShares >= socialConfig.max_entries_per_day) {
                return 0;
            }
        }
        
        const entries = socialConfig.entries_per_share;
        
        const { data: entry } = await this.supabase
            .from('draw_entries')
            .insert({
                draw_id: drawId,
                user_id: userId,
                entry_count: entries,
                entry_method: 'social_share',
                metadata: { platform }
            })
            .select()
            .single();
        
        await this.createTickets(drawId, userId, entry.id, entries);
        
        return entries;
    }

    /**
     * Add live stream email entry
     */
    async addLiveStreamEntry(
        drawId: string,
        email: string,
        name?: string
    ): Promise<number> {
        const { data: draw } = await this.supabase
            .from('draws')
            .select('entry_config, status')
            .eq('id', drawId)
            .single();
        
        if (draw?.status !== 'open') return 0;
        
        const config = draw.entry_config as EntryConfig;
        const liveConfig = config.live_stream;
        
        if (!liveConfig) return 0;
        
        // Find or create user by email
        let userId: string;
        const { data: existingUser } = await this.supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();
        
        if (existingUser) {
            userId = existingUser.id;
        } else {
            // Create temporary user
            const { data: newUser } = await this.supabase.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: { full_name: name || email.split('@')[0] }
            });
            userId = newUser.user.id;
        }
        
        const entries = liveConfig.entries_per_email;
        
        const { data: entry } = await this.supabase
            .from('draw_entries')
            .insert({
                draw_id: drawId,
                user_id: userId,
                entry_count: entries,
                entry_method: 'live_stream_entry',
                metadata: { email, source: 'live_broadcast' }
            })
            .select()
            .single();
        
        await this.createTickets(drawId, userId, entry.id, entries);
        
        return entries;
    }

    /**
     * Create individual tickets for entries
     */
    private async createTickets(
        drawId: string,
        userId: string,
        entryId: string,
        count: number
    ): Promise<void> {
        const tickets = [];
        const { data: lastTicket } = await this.supabase
            .from('draw_tickets')
            .select('ticket_number')
            .eq('draw_id', drawId)
            .order('ticket_number', { ascending: false })
            .limit(1)
            .single();
        
        let nextNumber = (lastTicket?.ticket_number || 0) + 1;
        
        for (let i = 0; i < count; i++) {
            tickets.push({
                draw_id: drawId,
                user_id: userId,
                entry_id: entryId,
                ticket_number: nextNumber + i
            });
        }
        
        await this.supabase.from('draw_tickets').insert(tickets);
    }

    /**
     * Perform the draw and select winners
     */
    async performDraw(drawId: string): Promise<{ winners: any[]; totalTickets: number }> {
        // Check draw status
        const { data: draw, error: drawError } = await this.supabase
            .from('draws')
            .select('*, draw_winners!left(count)')
            .eq('id', drawId)
            .single();
        
        if (drawError) throw drawError;
        if (draw.status !== 'closed' && draw.status !== 'open') {
            throw new Error('Draw is not ready for drawing');
        }
        
        // Update status to drawing
        await this.supabase
            .from('draws')
            .update({ status: 'drawing' })
            .eq('id', drawId);
        
        // Get all tickets
        const { data: tickets, error: ticketsError } = await this.supabase
            .from('draw_tickets')
            .select('id, user_id, ticket_number, profiles(full_name, email)')
            .eq('draw_id', drawId)
            .order('ticket_number');
        
        if (ticketsError) throw ticketsError;
        
        const totalTickets = tickets.length;
        if (totalTickets === 0) {
            await this.supabase
                .from('draws')
                .update({ status: 'completed' })
                .eq('id', drawId);
            return { winners: [], totalTickets: 0 };
        }
        
        // Shuffle and select winners (supporting multiple prize tiers)
        const shuffled = [...tickets];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Select top 3 as winners (or fewer if not enough tickets)
        const winners = shuffled.slice(0, Math.min(3, shuffled.length));
        
        // Record winners
        for (let i = 0; i < winners.length; i++) {
            const winner = winners[i];
            const rank = i + 1;
            
            await this.supabase
                .from('draw_tickets')
                .update({ is_winner: true, winner_rank: rank })
                .eq('id', winner.id);
            
            await this.supabase
                .from('draw_winners')
                .insert({
                    draw_id: drawId,
                    user_id: winner.user_id,
                    winner_rank: rank,
                    prize_name: rank === 1 ? draw.prize_name : `${draw.prize_name} - Runner Up`,
                    prize_value: rank === 1 ? draw.prize_value : (draw.prize_value ? draw.prize_value * 0.3 : null),
                    claim_status: 'pending',
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                });
        }
        
        // Award consolation points to non-winners
        const nonWinners = tickets.filter(t => !winners.find(w => w.id === t.id));
        const consolationPoints = 50; // Configurable
        
        for (const participant of nonWinners) {
            await this.pointsService.award(
                participant.user_id,
                consolationPoints,
                'draw_consolation',
                drawId
            );
        }
        
        // Update draw status
        await this.supabase
            .from('draws')
            .update({
                status: 'completed',
                winner_id: winners[0]?.user_id,
                winner_announced_at: new Date().toISOString(),
                winner_claim_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                consolation_points_awarded: true
            })
            .eq('id', drawId);
        
        // Send notifications
        await this.sendWinnerNotifications(drawId, winners);
        
        return { winners, totalTickets };
    }

    /**
     * Send winner notifications
     */
    private async sendWinnerNotifications(drawId: string, winners: any[]): Promise<void> {
        for (const winner of winners) {
            // Update winner record with notification timestamp
            await this.supabase
                .from('draw_winners')
                .update({
                    notified_at: new Date().toISOString(),
                    notified_method: 'email'
                })
                .eq('draw_id', drawId)
                .eq('user_id', winner.user_id);
            
            // TODO: Actually send email/SMS here
            console.log(`Notified ${winner.profiles?.email} about winning draw ${drawId}`);
        }
    }

    /**
     * Claim a prize
     */
    async claimPrize(drawId: string, userId: string): Promise<void> {
        const { data: winner, error } = await this.supabase
            .from('draw_winners')
            .select('*')
            .eq('draw_id', drawId)
            .eq('user_id', userId)
            .eq('claim_status', 'pending')
            .single();
        
        if (error || !winner) {
            throw new Error('No pending prize found');
        }
        
        if (new Date(winner.expires_at) < new Date()) {
            await this.supabase
                .from('draw_winners')
                .update({ claim_status: 'expired' })
                .eq('id', winner.id);
            throw new Error('Prize claim has expired');
        }
        
        await this.supabase
            .from('draw_winners')
            .update({
                claim_status: 'claimed',
                claimed_at: new Date().toISOString()
            })
            .eq('id', winner.id);
        
        // Award points if prize is points-based
        if (winner.prize_value && winner.winner_rank === 1) {
            await this.pointsService.award(userId, winner.prize_value, 'draw_win', drawId);
        }
    }

    /**
     * Admin: Force redraw if winner doesn't claim
     */
    async redrawUnclaimed(drawId: string): Promise<void> {
        const { data: unclaimedWinners } = await this.supabase
            .from('draw_winners')
            .select('*')
            .eq('draw_id', drawId)
            .eq('claim_status', 'pending')
            .lt('expires_at', new Date().toISOString());
        
        if (!unclaimedWinners || unclaimedWinners.length === 0) return;
        
        // Remove unclaimed winners' tickets
        for (const winner of unclaimedWinners) {
            await this.supabase
                .from('draw_tickets')
                .update({ is_winner: false, winner_rank: null })
                .eq('draw_id', drawId)
                .eq('user_id', winner.user_id);
            
            await this.supabase
                .from('draw_winners')
                .update({ claim_status: 'expired' })
                .eq('id', winner.id);
        }
        
        // Re-run draw for remaining tickets
        await this.performDraw(drawId);
    }

    /**
     * Get live ticker items
     */
    async getLiveTicker(drawId: string, limit: number = 30) {
        const { data } = await this.supabase
            .from('draw_live_ticker')
            .select('*')
            .eq('draw_id', drawId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        return data || [];
    }

    /**
     * Get entry count by method (for live display)
     */
    async getEntryStats(drawId: string) {
        const { data } = await this.supabase
            .from('draw_entries')
            .select('entry_method, entry_count')
            .eq('draw_id', drawId);
        
        const stats: Record<string, number> = {};
        data?.forEach(entry => {
            stats[entry.entry_method] = (stats[entry.entry_method] || 0) + entry.entry_count;
        });
        
        return stats;
    }
}