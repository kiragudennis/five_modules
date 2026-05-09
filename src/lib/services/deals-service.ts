// src/lib/services/deals-service.ts

import { createClient } from '@/lib/supabase/server';
import { Deal, DealClaim, DealStatus, UrgencyLevel } from '@/types/deals';
import { PointsService } from './points-service';

export class DealsService {
    private supabase = createClient();
    private pointsService = new PointsService();

    /**
     * Get all active deals
     */
    async getActiveDeals(userId?: string): Promise<Deal[]> {
        const now = new Date().toISOString();
        
        let query = this.supabase
            .from('deals')
            .select('*')
            .eq('status', 'active')
            .lte('starts_at', now)
            .gte('ends_at', now)
            .order('starts_at', { ascending: true });
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Augment with user claim counts if userId provided
        if (userId && data) {
            for (const deal of data) {
                const { count } = await this.supabase
                    .from('deal_claims')
                    .select('id', { count: 'exact', head: true })
                    .eq('deal_id', deal.id)
                    .eq('user_id', userId);
                
                (deal as any).user_claimed_count = count || 0;
            }
        }
        
        return data || [];
    }

    /**
     * Get deal by ID with real-time status
     */
    async getDeal(dealId: string, userId?: string): Promise<Deal & { status_data: DealStatus }> {
        const { data: deal, error } = await this.supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();
        
        if (error) throw error;
        
        const statusData = await this.getDealStatus(dealId, userId);
        
        let userClaimsCount = 0;
        if (userId) {
            const { count } = await this.supabase
                .from('deal_claims')
                .select('id', { count: 'exact', head: true })
                .eq('deal_id', dealId)
                .eq('user_id', userId);
            userClaimsCount = count || 0;
        }
        
        return {
            ...deal,
            status_data: statusData,
            user_claimed_count: userClaimsCount
        } as any;
    }

    /**
     * Get real-time deal status (urgency, stock, time)
     */
    async getDealStatus(dealId: string, userId?: string): Promise<DealStatus> {
        const { data: deal } = await this.supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();
        
        if (!deal) throw new Error('Deal not found');
        
        const now = new Date();
        const start = new Date(deal.starts_at);
        const end = new Date(deal.ends_at);
        
        const isActive = deal.status === 'active' && now >= start && now <= end;
        const timeRemainingMs = isActive ? end.getTime() - now.getTime() : 0;
        
        // Determine urgency level
        const minutesRemaining = Math.floor(timeRemainingMs / (1000 * 60));
        let urgencyLevel = deal.urgency_levels[0];
        for (const level of deal.urgency_levels) {
            if (minutesRemaining <= level.threshold_minutes) {
                urgencyLevel = level;
            }
        }
        
        // Stock calculations
        const stockRemaining = deal.remaining_quantity;
        const stockPercentage = deal.total_quantity 
            ? ((deal.total_quantity - (deal.remaining_quantity || 0)) / deal.total_quantity) * 100
            : 0;
        
        // User claims check
        let userClaimsCount = 0;
        let canClaim = isActive && (stockRemaining === null || stockRemaining > 0);
        
        if (userId && canClaim) {
            const { count } = await this.supabase
                .from('deal_claims')
                .select('id', { count: 'exact', head: true })
                .eq('deal_id', dealId)
                .eq('user_id', userId);
            userClaimsCount = count || 0;
            canClaim = userClaimsCount < deal.per_user_limit;
        }
        
        // Check if user can revive this deal
        let canRevive = false;
        let reviveCostPoints = null;
        
        if (userId && deal.points_to_revive && !canClaim && timeRemainingMs <= 0) {
            const { data: revival } = await this.supabase
                .from('deal_revivals')
                .select('*')
                .eq('deal_id', dealId)
                .eq('user_id', userId)
                .gt('revived_until', now.toISOString())
                .single();
            
            if (!revival) {
                const userPoints = await this.pointsService.getBalance(userId);
                canRevive = userPoints >= deal.points_to_revive;
                reviveCostPoints = deal.points_to_revive;
            } else {
                canRevive = true; // Already revived
            }
        }
        
        return {
            is_active: isActive,
            time_remaining_ms: timeRemainingMs,
            time_remaining_formatted: this.formatTimeRemaining(timeRemainingMs),
            urgency_level: urgencyLevel,
            stock_remaining: stockRemaining,
            stock_percentage: stockPercentage,
            can_claim: canClaim,
            user_claims_count: userClaimsCount,
            remaining_user_claims: Math.max(0, deal.per_user_limit - userClaimsCount),
            can_revive: canRevive,
            revive_cost_points: reviveCostPoints
        };
    }

    /**
     * Claim a deal (purchase)
     */
    async claimDeal(
        dealId: string,
        userId: string,
        orderId: string,
        quantity: number = 1
    ): Promise<DealClaim> {
        const deal = await this.getDeal(dealId, userId);
        const status = await this.getDealStatus(dealId, userId);
        
        if (!status.can_claim) {
            throw new Error('Cannot claim this deal');
        }
        
        // Check if this is a revived claim
        let wasRevived = false;
        const now = new Date();
        
        const { data: revival } = await this.supabase
            .from('deal_revivals')
            .select('*')
            .eq('deal_id', dealId)
            .eq('user_id', userId)
            .gt('revived_until', now.toISOString())
            .single();
        
        if (revival) {
            wasRevived = true;
        }
        
        // Calculate savings
        let savingsAmount = 0;
        let pricePaid = 0;
        
        if (deal.deal_type === 'discount' && deal.discount_value) {
            // Get product original price
            const { data: product } = await this.supabase
                .from('products')
                .select('price')
                .eq('id', deal.product_id)
                .single();
            
            if (product) {
                if (deal.discount_type === 'percentage') {
                    pricePaid = product.price * (1 - deal.discount_value / 100);
                } else {
                    pricePaid = product.price - deal.discount_value;
                }
                savingsAmount = (product.price - pricePaid) * quantity;
            }
        } else if (deal.deal_price) {
            const { data: product } = await this.supabase
                .from('products')
                .select('price')
                .eq('id', deal.product_id)
                .single();
            
            if (product) {
                savingsAmount = (product.price - deal.deal_price) * quantity;
                pricePaid = deal.deal_price * quantity;
            }
        }
        
        // Record claim
        const { data: claim, error: claimError } = await this.supabase
            .from('deal_claims')
            .insert({
                deal_id: dealId,
                user_id: userId,
                order_id: orderId,
                quantity: quantity,
                price_paid: pricePaid,
                savings_amount: savingsAmount,
                was_revived: wasRevived,
                revived_at: wasRevived ? now.toISOString() : null
            })
            .select()
            .single();
        
        if (claimError) throw claimError;
        
        // Update remaining stock
        if (deal.remaining_quantity !== null) {
            await this.supabase
                .from('deals')
                .update({ 
                    remaining_quantity: deal.remaining_quantity - quantity 
                })
                .eq('id', dealId);
        }
        
        // Award bonus points
        if (deal.bonus_points_per_purchase > 0) {
            await this.pointsService.award(
                userId,
                deal.bonus_points_per_purchase,
                'deal_purchase',
                dealId
            );
        }
        
        // Add to live ticker
        const { data: profile } = await this.supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();
        
        await this.supabase
            .from('deal_live_ticker')
            .insert({
                deal_id: dealId,
                user_name: profile?.full_name || 'Customer',
                user_location: 'Nairobi', // Could be geolocated
                quantity: quantity
            });
        
        return claim;
    }

    /**
     * Grant early access to a deal using points
     */
    async grantEarlyAccess(dealId: string, userId: string): Promise<void> {
        const { data: deal } = await this.supabase
            .from('deals')
            .select('points_required_for_early_access, starts_at')
            .eq('id', dealId)
            .single();
        
        if (!deal.points_required_for_early_access) {
            throw new Error('Early access not available for this deal');
        }
        
        // Check if already has access
        const { data: existing } = await this.supabase
            .from('deal_early_access')
            .select('id')
            .eq('deal_id', dealId)
            .eq('user_id', userId)
            .single();
        
        if (existing) {
            throw new Error('Already have early access');
        }
        
        // Spend points
        await this.pointsService.spend(
            userId,
            deal.points_required_for_early_access,
            'early_access',
            dealId
        );
        
        // Grant access (access becomes available 1 hour before public start)
        const accessGrantedAt = new Date();
        const publicStart = new Date(deal.starts_at);
        const earlyAccessTime = new Date(publicStart.getTime() - 60 * 60 * 1000);
        
        await this.supabase
            .from('deal_early_access')
            .insert({
                deal_id: dealId,
                user_id: userId,
                points_spent: deal.points_required_for_early_access,
                access_granted_at: accessGrantedAt.toISOString()
            });
    }

    /**
     * Revive an expired deal using points
     */
    async reviveDeal(dealId: string, userId: string): Promise<void> {
        const { data: deal } = await this.supabase
            .from('deals')
            .select('points_to_revive, revive_duration_minutes, ends_at')
            .eq('id', dealId)
            .single();
        
        if (!deal.points_to_revive) {
            throw new Error('Deal revival not available');
        }
        
        // Check if already revived
        const now = new Date();
        const { data: existing } = await this.supabase
            .from('deal_revivals')
            .select('*')
            .eq('deal_id', dealId)
            .eq('user_id', userId)
            .gt('revived_until', now.toISOString())
            .single();
        
        if (existing) {
            throw new Error('Deal already revived');
        }
        
        // Spend points
        await this.pointsService.spend(
            userId,
            deal.points_to_revive,
            'deal_revival',
            dealId
        );
        
        // Create revival record
        const revivedUntil = new Date(now.getTime() + deal.revive_duration_minutes * 60 * 1000);
        
        await this.supabase
            .from('deal_revivals')
            .insert({
                deal_id: dealId,
                user_id: userId,
                points_spent: deal.points_to_revive,
                revived_until: revivedUntil.toISOString()
            });
        
        // Also create a temporary deal extension for this user
        // (Handled in claimDeal which checks for revivals)
    }

    /**
     * Get live ticker items for broadcast
     */
    async getLiveTicker(dealId: string, limit: number = 30) {
        const { data } = await this.supabase
            .from('deal_live_ticker')
            .select('*')
            .eq('deal_id', dealId)
            .order('claimed_at', { ascending: false })
            .limit(limit);
        
        return data || [];
    }

    /**
     * Admin: Manually trigger a flash sale (instant activation)
     */
    async triggerFlashSale(dealId: string): Promise<void> {
        const now = new Date().toISOString();
        
        await this.supabase
            .from('deals')
            .update({
                status: 'active',
                starts_at: now,
                ends_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hour sale
            })
            .eq('id', dealId);
    }

    /**
     * Admin: Extend deal timer
     */
    async extendTimer(dealId: string, extraMinutes: number): Promise<void> {
        const { data: deal } = await this.supabase
            .from('deals')
            .select('ends_at')
            .eq('id', dealId)
            .single();
        
        const newEnd = new Date(deal.ends_at);
        newEnd.setMinutes(newEnd.getMinutes() + extraMinutes);
        
        await this.supabase
            .from('deals')
            .update({ ends_at: newEnd.toISOString() })
            .eq('id', dealId);
    }

    /**
     * Admin: Add stock to deal
     */
    async addStock(dealId: string, additionalQuantity: number): Promise<void> {
        const { data: deal } = await this.supabase
            .from('deals')
            .select('remaining_quantity, total_quantity')
            .eq('id', dealId)
            .single();
        
        const newRemaining = (deal.remaining_quantity || 0) + additionalQuantity;
        const newTotal = (deal.total_quantity || 0) + additionalQuantity;
        
        await this.supabase
            .from('deals')
            .update({
                remaining_quantity: newRemaining,
                total_quantity: newTotal
            })
            .eq('id', dealId);
    }

    /**
     * Admin: Reveal mystery deal
     */
    async revealMysteryDeal(dealId: string): Promise<{ product_name: string; price: number }> {
        const { data: deal } = await this.supabase
            .from('deals')
            .select('mystery_config')
            .eq('id', dealId)
            .single();
        
        if (!deal.mystery_config) {
            throw new Error('Not a mystery deal');
        }
        
        const { data: product } = await this.supabase
            .from('products')
            .select('name, price')
            .eq('id', deal.mystery_config.hidden_product_id)
            .single();
        
        // Update deal to show revealed product
        await this.supabase
            .from('deals')
            .update({
                name: `✨ MYSTERY REVEALED: ${product.name} ✨`,
                featured_image_url: product.image_url,
                mystery_config: {
                    ...deal.mystery_config,
                    revealed_at: new Date().toISOString()
                }
            })
            .eq('id', dealId);
        
        return {
            product_name: product.name,
            price: deal.mystery_config.hidden_price
        };
    }

    private formatTimeRemaining(ms: number): string {
        if (ms <= 0) return 'Ended';
        
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }
}