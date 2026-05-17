// src/lib/services/bundle-service.ts
import { Bundle, BundlePurchase } from "@/types/bundles";
import { SupabaseClient } from "@supabase/supabase-js";

export class BundleService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all active bundles
   */
  async getActiveBundles(): Promise<Bundle[]> {
    const { data, error } = await this.supabase
      .from("bundles")
      .select("*")
      .eq("status", "active")
      .lte("starts_at", new Date().toISOString())
      .gte("ends_at", new Date().toISOString())
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get bundle by ID
   */
  // Update bundle-service.ts getBundleById method with better error handling

  async getBundleById(bundleId: string): Promise<Bundle | null> {
    try {
      const { data, error } = await this.supabase
        .from("bundles")
        .select("*")
        .eq("id", bundleId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 404 errors

      if (error) {
        console.error("Error fetching bundle:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Exception in getBundleById:", error);
      return null;
    }
  }

  /**
   * Get eligible products for build-your-own bundle
   */
  async getEligibleProducts(bundleId: string): Promise<any[]> {
    const bundle = await this.getBundleById(bundleId);
    if (!bundle || bundle.bundle_type !== "build_own") return [];

    let query = this.supabase.from("products").select("*");

    if (bundle.eligible_categories && bundle.eligible_categories.length > 0) {
      query = query.in("category", bundle.eligible_categories);
    }
    if (bundle.eligible_product_ids && bundle.eligible_product_ids.length > 0) {
      query = query.in("id", bundle.eligible_product_ids);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Check bundle availability
   */
  async checkAvailability(
    bundleId: string,
    quantity: number = 1,
  ): Promise<{
    available: boolean;
    remaining: number;
    message: string;
  }> {
    const { data, error } = await this.supabase.rpc(
      "check_bundle_availability",
      {
        p_bundle_id: bundleId,
        p_quantity: quantity,
      },
    );

    if (error) throw error;
    return data;
  }

  /**
   * Purchase a bundle
   */
  async purchaseBundle(
    bundleId: string,
    userId: string,
    options?: {
      quantity?: number;
      selectedItems?: any[];
      pointsToUse?: number;
    },
  ): Promise<BundlePurchase> {
    const bundle = await this.getBundleById(bundleId);
    if (!bundle) throw new Error("Bundle not found");

    // Check availability
    const availability = await this.checkAvailability(
      bundleId,
      options?.quantity || 1,
    );
    if (!availability.available) {
      throw new Error(availability.message);
    }

    // Calculate final price based on bundle type
    let finalPrice = bundle.discounted_price || bundle.base_price;
    let discountAmount = 0;
    let appliedTier = null;

    if (
      bundle.bundle_type === "tiered" &&
      bundle.tier_config &&
      options?.selectedItems
    ) {
      const itemCount = options.selectedItems.length;
      const tiers = bundle.tier_config.sort(
        (a: any, b: any) => b.min_items - a.min_items,
      );
      const applicableTier = tiers.find(
        (tier: any) => itemCount >= tier.min_items,
      );

      if (applicableTier) {
        discountAmount = (bundle.base_price * applicableTier.discount) / 100;
        finalPrice = bundle.base_price - discountAmount;
        appliedTier = applicableTier;
      }
    }

    // Handle points usage
    let pointsUsed = 0;
    if (options?.pointsToUse && bundle.points_required > 0) {
      pointsUsed = Math.min(options.pointsToUse, bundle.points_required);
    }

    // Create purchase record
    const { data: purchase, error } = await this.supabase
      .from("bundle_purchases")
      .insert({
        bundle_id: bundleId,
        user_id: userId,
        quantity: options?.quantity || 1,
        selected_items: options?.selectedItems || [],
        applied_tier: appliedTier,
        original_price: bundle.base_price,
        discount_amount: discountAmount,
        final_price: finalPrice,
        points_used: pointsUsed,
        points_awarded: bundle.bonus_points,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    // Award bonus points
    if (bundle.bonus_points > 0) {
      await this.awardBonusPoints(userId, bundle.bonus_points, bundleId);
    }

    // Handle mystery bundle reveal if immediate
    if (
      bundle.bundle_type === "mystery" &&
      bundle.mystery_reveal_mode === "immediate"
    ) {
      await this.revealMysteryBundle(bundleId, userId);
    }

    return purchase;
  }

  /**
   * Reveal mystery bundle contents
   */
  async revealMysteryBundle(bundleId: string, userId: string): Promise<any> {
    const bundle = await this.getBundleById(bundleId);
    if (!bundle || bundle.bundle_type !== "mystery") {
      throw new Error("Not a mystery bundle");
    }

    if (bundle.is_mystery_revealed) {
      return bundle.mystery_products;
    }

    // Mark as revealed
    const { error } = await this.supabase
      .from("bundles")
      .update({
        is_mystery_revealed: true,
        mystery_revealed_at: new Date().toISOString(),
      })
      .eq("id", bundleId);

    if (error) throw error;

    // Log the reveal
    await this.supabase.from("bundle_reveals").insert({
      bundle_id: bundleId,
      revealed_by: userId,
      products: bundle.mystery_products,
      is_public: true,
    });

    // Add to live ticker
    await this.supabase.from("bundle_live_ticker").insert({
      bundle_id: bundleId,
      action: "revealed",
      message: `Mystery bundle contents revealed!`,
    });

    return bundle.mystery_products;
  }

  /**
   * Subscribe to bundle live updates
   */
  subscribeToLiveUpdates(
    bundleId: string,
    callbacks: {
      onPurchase?: (purchase: any) => void;
      onReveal?: (reveal: any) => void;
      onStockUpdate?: (remaining: number) => void;
    },
  ) {
    const channel = this.supabase.channel(`bundle-live-${bundleId}`);

    // Listen for purchases
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "bundle_purchases",
        filter: `bundle_id=eq.${bundleId}`,
      },
      async (payload) => {
        // Fetch user name
        const { data: user } = await this.supabase
          .from("users")
          .select("full_name")
          .eq("id", payload.new.user_id)
          .single();

        callbacks.onPurchase?.({
          ...payload.new,
          user_name: user?.full_name || "Someone",
        });
      },
    );

    // Listen for reveals
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "bundle_reveals",
        filter: `bundle_id=eq.${bundleId}`,
      },
      (payload) => {
        callbacks.onReveal?.(payload.new);
      },
    );

    // Listen for bundle updates (stock changes)
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "bundles",
        filter: `id=eq.${bundleId}`,
      },
      (payload) => {
        if (payload.new.remaining_count !== payload.old.remaining_count) {
          callbacks.onStockUpdate?.(payload.new.remaining_count);
        }
      },
    );

    channel.subscribe();
    return () => channel.unsubscribe();
  }

  /**
   * Get live ticker for bundle
   */
  async getLiveTicker(bundleId: string, limit: number = 20) {
    const { data, error } = await this.supabase
      .from("bundle_live_ticker")
      .select("*")
      .eq("bundle_id", bundleId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  private async awardBonusPoints(
    userId: string,
    points: number,
    bundleId: string,
  ) {
    await this.supabase.rpc("award_bonus_points", {
      p_user_id: userId,
      p_points: points,
      p_source: "bundle_purchase",
      p_source_id: bundleId,
    });
  }
}
