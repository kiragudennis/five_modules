// src/lib/services/notification-service.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface Notification {
  id: string;
  user_id: string;
  type: 'draw_win' | 'draw_reminder' | 'entry_confirmation' | 'promotion' | 'system';
  title: string;
  message: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

export class NotificationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Send in-app notification to a user
   */
  async sendInAppNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    metadata?: any
  ): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Send email via Resend (queued)
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
    metadata?: any
  ): Promise<void> {
    // Queue email for sending
    const { error } = await this.supabase
      .from('email_queue')
      .insert({
        to_email: to,
        subject,
        html_content: html,
        text_content: text,
        metadata: metadata || {},
        status: 'pending',
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
    claimExpiresAt: Date
  ): Promise<void> {
    // In-app notification
    await this.sendInAppNotification(
      userId,
      'draw_win',
      `🎉 Congratulations! You won ${drawName}!`,
      `You've won ${prizeName}! Click to claim your prize before ${claimExpiresAt.toLocaleDateString()}.`,
      { drawName, prizeName, claimUrl, expiresAt: claimExpiresAt.toISOString() }
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
      { type: 'draw_win', drawId: drawName, userId }
    );
  }

  /**
   * Send entry confirmation notification
   */
  async sendEntryConfirmation(
    userId: string,
    drawName: string,
    entryCount: number,
    method: string
  ): Promise<void> {
    await this.sendInAppNotification(
      userId,
      'entry_confirmation',
      `Entry confirmed for ${drawName}!`,
      `You earned ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'} via ${method}. Good luck!`,
      { drawName, entryCount, method }
    );
  }

  /**
   * Send draw reminder notification
   */
  async sendDrawReminder(
    userId: string,
    drawName: string,
    drawTime: Date,
    userEntries: number
  ): Promise<void> {
    const timeRemaining = Math.ceil((drawTime.getTime() - Date.now()) / (1000 * 60 * 60));
    
    await this.sendInAppNotification(
      userId,
      'draw_reminder',
      `⏰ ${drawName} drawing soon!`,
      `The draw for ${drawName} happens in ${timeRemaining} hours. You have ${userEntries} entries. Good luck!`,
      { drawName, drawTime: drawTime.toISOString(), userEntries }
    );
  }

  /**
   * Get user's unread notifications
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user's all notifications (paginated)
   */
  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ notifications: Notification[]; total: number }> {
    const [{ data, error }, { count }] = await Promise.all([
      this.supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      this.supabase
        .from('user_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    if (error) throw error;
    return { notifications: data || [], total: count || 0 };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }
}

// Email worker function (to be called via cron job or edge function)
export async function processEmailQueue(): Promise<{ sent: number; failed: number }> {
  const supabase = createClient(...); // Your server client
  
  const { data: pendingEmails } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50);

  let sent = 0;
  let failed = 0;

  for (const email of pendingEmails || []) {
    try {
      await resend.emails.send({
        from: 'noreply@yourstore.com',
        to: email.to_email,
        subject: email.subject,
        html: email.html_content,
        text: email.text_content,
      });

      await supabase
        .from('email_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', email.id);
      
      sent++;
    } catch (error: any) {
      const retryCount = (email.retry_count || 0) + 1;
      const newStatus = retryCount >= 3 ? 'failed' : 'retry';
      
      await supabase
        .from('email_queue')
        .update({
          status: newStatus,
          retry_count: retryCount,
          error_message: error.message,
        })
        .eq('id', email.id);
      
      failed++;
    }
  }

  return { sent, failed };
}