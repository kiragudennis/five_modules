// src/lib/services/spinning-wheel-service.ts

import { createClient } from '@/lib/supabase/server';
import { SpinGame, PrizeSegment, SpinAttempt, UserSpinAllocation } from '@/types/spinning-wheel';
import { PointsService } from './points-service';

export class SpinningWheelService {
  private supabase = createClient();
  private pointsService = new PointsService();

  /**
   * Get all active games available to a user
   */
  async getAvailableGames(userId: string): Promise<SpinGame[]> {
    const now = new Date().toISOString();
    
    const { data: games, error } = await this.supabase
      .from('spin_games')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('game_type', { ascending: true });

    if (error) throw error;

    // Filter based on user eligibility
    const userTier = await this.getUserTier(userId);
    const userPurchaseCount = await this.getUserPurchaseCount(userId);
    const isNewCustomer = await this.isNewCustomer(userId);

    return (games || []).filter((game: SpinGame) => {
      // Tier check
      if (game.eligible_tiers.length && !game.eligible_tiers.includes(userTier)) {
        return false;
      }
      // Purchase count check
      if (game.requires_purchase_count && userPurchaseCount < game.requires_purchase_count) {
        return false;
      }
      // New customer check
      if (game.new_customer_only && !isNewCustomer) {
        return false;
      }
      // Single prize already claimed
      if (game.is_single_prize && game.single_prize_claimed) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get user's spin allocation for a specific game
   */
  async getUserAllocation(userId: string, gameId: string): Promise<UserSpinAllocation> {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = this.getWeekStart();

    // Get or create allocation record
    let { data: allocation } = await this.supabase
      .from('user_spin_allocations')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .eq('date', today)
      .single();

    if (!allocation) {
      const { data: game } = await this.supabase
        .from('spin_games')
        .select('free_spins_per_day, free_spins_per_week, free_spins_total')
        .eq('id', gameId)
        .single();

      allocation = {
        user_id: userId,
        game_id: gameId,
        date: today,
        spins_used_today: 0,
        spins_used_this_week: 0,
        spins_used_total: 0,
        last_spin_at: null,
      };
    }

    const { data: game } = await this.supabase
      .from('spin_games')
      .select('free_spins_per_day, free_spins_per_week, free_spins_total, points_per_paid_spin')
      .eq('id', gameId)
      .single();

    const freeRemainingTotal = Math.max(0, game.free_spins_total - allocation.spins_used_total);
    const freeRemainingToday = Math.max(0, game.free_spins_per_day - allocation.spins_used_today);
    const freeRemainingWeek = Math.max(0, game.free_spins_per_week - allocation.spins_used_this_week);
    const canSpinFree = freeRemainingTotal > 0 && freeRemainingToday > 0 && freeRemainingWeek > 0;

    const userPoints = await this.pointsService.getBalance(userId);
    const canSpinPaid = userPoints >= game.points_per_paid_spin;

    return {
      spins_used_today: allocation.spins_used_today,
      spins_used_this_week: allocation.spins_used_this_week,
      spins_used_total: allocation.spins_used_total,
      free_spins_remaining_today: freeRemainingToday,
      free_spins_remaining_week: freeRemainingWeek,
      free_spins_remaining_total: freeRemainingTotal,
      can_spin_free: canSpinFree,
      can_spin_paid: canSpinPaid,
      points_required_for_paid: game.points_per_paid_spin,
    };
  }

  /**
   * Perform a spin
   */
  async spin(
    userId: string,
    gameId: string,
    spinType: 'free' | 'points' | 'purchase' | 'bonus'
  ): Promise<SpinAttempt & { prizeDisplay: string }> {
    // Get game with prize config
    const { data: game, error: gameError } = await this.supabase
      .from('spin_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;

    // Check single prize not already claimed
    if (game.is_single_prize && game.single_prize_claimed) {
      throw new Error('This prize has already been won');
    }

    // Check spin eligibility
    const allocation = await this.getUserAllocation(userId, gameId);
    
    if (spinType === 'free' && !allocation.can_spin_free) {
      throw new Error('No free spins remaining');
    }
    
    if (spinType === 'points') {
      const userPoints = await this.pointsService.getBalance(userId);
      if (userPoints < game.points_per_paid_spin) {
        throw new Error('Insufficient points');
      }
      // Spend points
      await this.pointsService.spend(userId, game.points_per_paid_spin, 'spin_payment', gameId);
    }

    // Calculate spin result based on probabilities
    const selectedSegment = this.selectPrizeByProbability(game.prize_config);
    const segmentIndex = game.prize_config.findIndex(p => p.label === selectedSegment.label);
    
    // Award prize
    let pointsAwarded = 0;
    let prizeDisplay = '';
    
    switch (selectedSegment.type) {
      case 'points':
        pointsAwarded = parseInt(selectedSegment.value as string);
        await this.pointsService.award(userId, pointsAwarded, 'spin_win', gameId);
        prizeDisplay = `${pointsAwarded} points`;
        break;
      case 'discount':
        prizeDisplay = `${selectedSegment.value}% off`;
        break;
      case 'free_shipping':
        prizeDisplay = 'Free Shipping';
        break;
      case 'product':
        prizeDisplay = `Free ${selectedSegment.value}`;
        break;
      case 'bundle':
        prizeDisplay = `Free ${selectedSegment.value} Bundle`;
        break;
    }

    // Record spin attempt
    const { data: attempt, error: attemptError } = await this.supabase
      .from('spin_attempts')
      .insert({
        game_id: gameId,
        user_id: userId,
        spin_type: spinType,
        prize_type: selectedSegment.type,
        prize_value: selectedSegment.value as string,
        points_awarded: pointsAwarded,
        points_spent: spinType === 'points' ? game.points_per_paid_spin : 0,
        segment_index: segmentIndex,
        landed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    // Update allocation
    await this.updateAllocation(userId, gameId, spinType);

    // Update single prize if claimed
    if (game.is_single_prize && spinType !== 'points') {
      await this.supabase
        .from('spin_games')
        .update({
          single_prize_claimed: true,
          single_prize_winner_id: userId,
        })
        .eq('id', gameId);
    }

    // Add to live ticker
    const { data: userProfile } = await this.supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    await this.supabase.from('spin_live_ticker').insert({
      game_id: gameId,
      user_name: userProfile?.full_name || 'Customer',
      prize_text: prizeDisplay,
    });

    return {
      ...attempt,
      prizeDisplay,
    };
  }

  /**
   * Select prize based on probability distribution
   */
  private selectPrizeByProbability(prizes: PrizeSegment[]): PrizeSegment {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const prize of prizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        return prize;
      }
    }
    return prizes[0];
  }

  /**
   * Get live ticker items for broadcast
   */
  async getLiveTicker(gameId: string, limit: number = 20) {
    const { data } = await this.supabase
      .from('spin_live_ticker')
      .select('user_name, prize_text, created_at')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return data || [];
  }

  // Helper methods
  private async getUserTier(userId: string): Promise<string> {
    const { data } = await this.supabase
      .from('loyalty_points')
      .select('tier')
      .eq('user_id', userId)
      .single();
    return data?.tier || 'bronze';
  }

  private async getUserPurchaseCount(userId: string): Promise<number> {
    const { count } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');
    return count || 0;
  }

  private async isNewCustomer(userId: string): Promise<boolean> {
    const { count } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (count || 0) === 0;
  }

  private async updateAllocation(userId: string, gameId: string, spinType: string) {
    const today = new Date().toISOString().split('T')[0];
    
    // Upsert allocation increment
    await this.supabase.rpc('increment_spin_usage', {
      p_user_id: userId,
      p_game_id: gameId,
      p_date: today,
    });
  }

  private getWeekStart(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  }
}