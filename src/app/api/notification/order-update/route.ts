// app/api/notifications/order-update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { resend, secureRatelimit } from "@/lib/limit";

export async function POST(request: NextRequest) {
  // Rate limiting
  const { success } = await secureRatelimit(request);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await request.json();

    const {
      orderId,
      customerEmail,
      customerName,
      oldStatus,
      newStatus,
      trackingNumber,
      orderTotal,
      orderDate,
      orderItems,
    } = body;

    // Email subject based on status change
    let subject = "";
    let template = "";

    switch (newStatus) {
      case "paid":
        subject = `Payment Confirmed - Order #${orderId}`;
        template = `
          <h2>Payment Confirmed!</h2>
          <p>Hi ${customerName},</p>
          <p>We've received your payment for order <strong>#${orderId}</strong>.</p>
          <p>We're now preparing your order for shipment.</p>
        `;
        break;

      case "shipped":
        subject = `Your Order Has Shipped - Order #${orderId}`;
        template = `
          <h2>Your Order is on the Way! 🚚</h2>
          <p>Hi ${customerName},</p>
          <p>Great news! Your order <strong>#${orderId}</strong> has been shipped.</p>
          ${
            trackingNumber
              ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>`
              : ""
          }
          <p>You can track your shipment using the link below.</p>
        `;
        break;

      case "delivered":
        subject = `Order Delivered - Order #${orderId}`;
        template = `
          <h2>Your Order Has Been Delivered! 🎉</h2>
          <p>Hi ${customerName},</p>
          <p>Your order <strong>#${orderId}</strong> has been successfully delivered.</p>
          <p>We hope you love your new lighting products! If you have any questions or concerns, please don't hesitate to contact us.</p>
        `;
        break;

      default:
        subject = `Order Status Updated - Order #${orderId}`;
        template = `
          <h2>Order Status Updated</h2>
          <p>Hi ${customerName},</p>
          <p>The status of your order <strong>#${orderId}</strong> has been updated from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.</p>
        `;
    }

    // Order summary HTML
    const orderSummary = `
      <div style="margin: 20px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Order ID:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">#${orderId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Order Date:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${format(
              new Date(orderDate),
              "MMM dd, yyyy",
            )}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Total Amount:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">KES ${orderTotal.toFixed(
              2,
            )}</td>
          </tr>
          ${
            trackingNumber
              ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Tracking Number:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${trackingNumber}</td>
            </tr>
          `
              : ""
          }
        </table>
        
        <h4 style="margin-top: 20px; margin-bottom: 10px;">Order Items:</h4>
        ${orderItems
          .map(
            (item: any) => `
          <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
            <strong>${item.title}</strong><br>
            Quantity: ${item.quantity} × KES ${item.price.toFixed(2)}<br>
            <span style="color: #6b7280;">SKU: ${item.sku}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    `;

    // Action buttons HTML
    const actionButtons = `
      <div style="margin: 30px 0; text-align: center;">
        <a href="${
          process.env.NEXT_PUBLIC_SITE_URL
        }/checkout/success/orderId/${orderId}" 
           style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
          View Order Details
        </a>
        ${
          trackingNumber
            ? `
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/tracking/${trackingNumber}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
            Track Shipment
          </a>
        `
            : ""
        }
      </div>
    `;

    // Full email HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; color: #f59e0b; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Blessed Two Electronics</div>
              <p>Lighting Up Nairobi Since 2010</p>
            </div>
            
            ${template}
            ${orderSummary}
            ${actionButtons}
            
            <div class="footer">
              <p>Blessed Two Electronics<br>
              Duruma Road, Nairobi<br>
              Phone: +254 727 833691<br>
              Email: info@blessedtwo.com</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "Blessed Two Electronics <orders@noreply.worldsamma.org>",
      to: [customerEmail],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error: any) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
