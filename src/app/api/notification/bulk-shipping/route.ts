// app/api/notifications/bulk-shipping/route.ts
import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend, secureRatelimit } from "@/lib/limit";

export async function POST(request: NextRequest) {
  // Rate limiting
  const { success } = await secureRatelimit(request);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { orderIds, subject, template } = body;

    // Get order details
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        order_items(
          *,
          products(name)
        ),
        transactions(*)
      `,
      )
      .in("id", orderIds);

    if (error) throw error;

    // Prepare email promises
    const emailPromises = orders.map(async (order: any) => {
      // Replace placeholders
      const customerName = `${order.shipping_info.firstName} ${
        order.shipping_info.lastName || ""
      }`.trim();

      const personalizedTemplate = template
        .replace(/{customer_name}/g, customerName)
        .replace(/{order_id}/g, order.id.substring(0, 8))
        .replace(/{tracking_number}/g, order.tracking_number || "Not assigned")
        .replace(
          /{shipping_method}/g,
          order.metadata?.shipping_info?.shipping_method || "Standard",
        )
        .replace(
          /{estimated_delivery}/g,
          order.metadata?.shipping_info?.estimated_delivery
            ? format(
                new Date(order.metadata.shipping_info.estimated_delivery),
                "MMM dd, yyyy",
              )
            : "3-5 business days",
        )
        .replace(
          /{order_date}/g,
          format(new Date(order.created_at), "MMM dd, yyyy"),
        )
        .replace(/{order_total}/g, `KES ${order.total.toFixed(2)}`)
        .replace(
          /{shipping_address}/g,
          `${order.shipping_info.address}, ${order.shipping_info.city}, ${order.shipping_info.country}`,
        );

      // Create HTML email
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; padding: 20px 0; }
              .logo { font-size: 24px; font-weight: bold; color: #f59e0b; }
              .content { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .tracking-box { background: white; padding: 15px; border: 2px dashed #f59e0b; border-radius: 6px; text-align: center; margin: 20px 0; }
              .tracking-number { font-family: monospace; font-size: 18px; font-weight: bold; color: #f59e0b; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Blessed Two Electronics</div>
                <p>Lighting Up Nairobi Since 2010</p>
              </div>
              
              <div class="content">
                ${personalizedTemplate.replace(/\n/g, "<br>")}
                
                ${
                  order.tracking_number
                    ? `
                  <div class="tracking-box">
                    <p><strong>Track Your Shipment:</strong></p>
                    <p class="tracking-number">${order.tracking_number}</p>
                    <p>
                      <a href="https://tracking.example.com/${order.tracking_number}" 
                         style="background-color: #f59e0b; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">
                        Track Now
                      </a>
                    </p>
                  </div>
                `
                    : ""
                }
              </div>
              
              <div class="footer">
                <p><strong>Blessed Two Electronics</strong><br>
                Duruma Road, Nairobi<br>
                📞 0700 000 000 | 📧 info@blessedtwo.co.ke</p>
                <p>This is an automated message, please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Send email
      return resend.emails.send({
        from: "Blessed Two Shipping <shipping@noreply.worldsammaorg>",
        to: [order.shipping_info.email],
        subject: subject,
        html: html,
      });
    });

    // Send all emails
    const results = await Promise.allSettled(emailPromises);

    // Count successful emails
    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Update order metadata with notification sent
    if (sent > 0) {
      await supabaseAdmin.rpc("update_notification_sent", {
        order_ids: orderIds,
        notification_type: "shipping_update",
        sent_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: orderIds.length,
    });
  } catch (error: any) {
    console.error("Bulk email error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
