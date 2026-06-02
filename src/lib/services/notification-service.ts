// src/lib/services/notification-service.ts (UPDATED)
import { SupabaseClient } from "@supabase/supabase-js";

export interface Notification {
  id: string;
  user_id: string;
  type:
    | "draw_win"
    | "draw_runner_up"
    | "draw_reminder"
    | "draw_entry_confirmed"
    | "draw_consolation"
    | "draw_redraw"
    | "loyalty_partial_redeem"
    | "loyalty_points_earned"
    | "loyalty_points_expiring"
    | "loyalty_tier_upgrade"
    | "order_confirmation"
    | "order_shipped"
    | "order_delivered"
    | "payment_received"
    | "payment_failed"
    | "coupon_issued"
    | "system_alert"
    | "rank_improved"
    | "challenge_joined"
    | "entry_confirmation"
    | "promotion";
  title: string;
  message: string;
  metadata: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// ============================================
// STANDALONE FUNCTIONS (for notification-bell.tsx)
// ============================================

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("get_unread_notification_count", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
  return data || 0;
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
    p_user_id: userId,
  });

  if (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase.rpc("mark_all_notifications_read", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

/**
 * Get paginated notifications for a user
 */
export async function getUserNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 20,
  offset: number = 0,
  includeRead: boolean = true,
): Promise<Notification[]> {
  const { data, error } = await supabase.rpc("get_user_notifications", {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
    p_include_read: includeRead,
  });

  if (error) {
    console.error("Error getting notifications:", error);
    return [];
  }

  // Map snake_case DB columns to camelCase for frontend
  return (data || []).map((n: any) => ({
    id: n.id,
    user_id: n.user_id || userId,
    type: n.type,
    title: n.title,
    message: n.message,
    metadata: n.metadata,
    is_read: n.read,
    read_at: n.read_at,
    created_at: n.created_at,
  }));
}

// ============================================
// NOTIFICATION SERVICE CLASS (for other uses)
// ============================================

export class NotificationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Send in-app notification to a user
   */
  async sendInAppNotification(
    userId: string,
    type: Notification["type"],
    title: string,
    message: string,
    metadata?: any,
  ): Promise<Notification | null> {
    const { data, error } = await this.supabase.rpc("create_notification", {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_message: message,
      p_metadata: metadata || {},
    });

    if (error) {
      console.error("Error sending notification:", error);
      return null;
    }
    return data;
  }

  /**
   * Send email via email queue
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
    metadata?: any,
  ): Promise<void> {
    const { error } = await this.supabase.from("email_queue").insert({
      to_email: to,
      subject,
      html_content: html,
      text_content: text,
      metadata: metadata || {},
      status: "pending",
      scheduled_for: new Date().toISOString(),
    });

    if (error) throw error;
  }

  /**
   * Send winner notification (both in-app and email)
   */
  async sendWinnerNotification(
    userId: string,
    email: string,
    userName: string,
    drawName: string,
    prizeName: string,
    claimUrl: string,
    claimExpiresAt: Date,
  ): Promise<void> {
    // In-app notification
    await this.sendInAppNotification(
      userId,
      "draw_win",
      `🎉 Congratulations! You won ${drawName}!`,
      `You've won ${prizeName}! Click to claim your prize before ${claimExpiresAt.toLocaleDateString()}.`,
      {
        drawName,
        prizeName,
        claimUrl,
        expiresAt: claimExpiresAt.toISOString(),
      },
    );

    // Email notification
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .prize { font-size: 24px; font-weight: bold; color: #8B5CF6; margin: 20px 0; }
          .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
          .expiry { color: #ef4444; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations! 🎉</h1>
          </div>
          <div class="content">
            <h2>You're a winner, ${userName}!</h2>
            <p>Great news! You've been selected as the winner of <strong>${drawName}</strong>.</p>
            <div class="prize">🏆 ${prizeName} 🏆</div>
            <p>To claim your prize, click the button below:</p>
            <div style="text-align: center;">
              <a href="${claimUrl}" class="button">Claim My Prize</a>
            </div>
            <p class="expiry">⚠️ This claim link expires on ${claimExpiresAt.toLocaleDateString()}.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(
      email,
      `🎉 Congratulations! You won ${drawName}!`,
      emailHtml,
      `Congratulations ${userName}! You won ${prizeName} in ${drawName}. Claim your prize here: ${claimUrl}`,
      { type: "draw_win", drawId: drawName, userId },
    );
  }

  /**
   * Send entry confirmation notification
   */
  async sendEntryConfirmation(
    userId: string,
    drawName: string,
    entryCount: number,
    method: string,
  ): Promise<void> {
    await this.sendInAppNotification(
      userId,
      "draw_entry_confirmed",
      `Entry confirmed for ${drawName}!`,
      `You earned ${entryCount} ${entryCount === 1 ? "entry" : "entries"} via ${method}. Good luck!`,
      { drawName, entryCount, method },
    );
  }

  /**
   * Send draw reminder notification
   */
  async sendDrawReminder(
    userId: string,
    drawName: string,
    drawTime: Date,
    userEntries: number,
  ): Promise<void> {
    const timeRemaining = Math.ceil(
      (drawTime.getTime() - Date.now()) / (1000 * 60 * 60),
    );

    await this.sendInAppNotification(
      userId,
      "draw_reminder",
      `⏰ ${drawName} drawing soon!`,
      `The draw for ${drawName} happens in ${timeRemaining} hours. You have ${userEntries} entries. Good luck!`,
      { drawName, drawTime: drawTime.toISOString(), userEntries },
    );
  }

  // Convenience methods that delegate to standalone functions
  async getUnreadCount(userId: string): Promise<number> {
    return getUnreadNotificationCount(this.supabase, userId);
  }

  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const notifications = await getUserNotifications(
      this.supabase,
      userId,
      limit,
      offset,
      true,
    );

    const { count } = await this.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    return { notifications, total: count || 0 };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    return markNotificationRead(this.supabase, notificationId, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    return markAllNotificationsRead(this.supabase, userId);
  }
}
