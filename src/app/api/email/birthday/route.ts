// app/api/email/birthday/route.ts
import { resend, secureRatelimit } from "@/lib/limit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Rate limiting
  const { success } = await secureRatelimit(request);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { email, name, points, customMessage, tier } = await request.json();

    const { data, error } = await resend.emails.send({
      from: "Blessed Two Electronics <birthdays@noreply.worldsamma.org>",
      to: email,
      subject: `🎂 Happy Birthday ${name}! Your ${points} Loyalty Points Gift`,
      html: generateBirthdayEmail(name, points, customMessage, tier),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Email error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateBirthdayEmail(
  name: string,
  points: number,
  customMessage?: string,
  tier?: string,
): string {
  const tierBenefits: Record<string, string> = {
    platinum: "Free priority shipping, 15% discount, VIP support",
    gold: "Free shipping over KES 2,000, 10% discount",
    silver: "Free shipping over KES 3,000, 5% discount",
    bronze: "Standard shipping rates",
  };

  const benefit = tier
    ? tierBenefits[tier] || tierBenefits.bronze
    : tierBenefits.bronze;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Happy Birthday from Blessed Two Electronics!</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', Arial, sans-serif; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 40px; color: #333; max-width: 600px; margin: auto; }
        .container { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(236, 72, 153, 0.1); }
        .header { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); padding: 40px; text-align: center; color: white; }
        .content { padding: 40px; }
        .points-card { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0; }
        .points-number { font-size: 48px; font-weight: bold; color: #92400e; margin: 10px 0; }
        .benefits { background: #f8fafc; border-radius: 12px; padding: 24px; margin-top: 30px; }
        .store-info { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 20px; margin-top: 30px; }
        .button { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div style="font-size: 64px; margin-bottom: 20px;">🎂</div>
          <h1 style="font-size: 32px; font-weight: bold; margin: 0;">Happy Birthday, ${name}!</h1>
          <p style="opacity: 0.9; font-size: 18px; margin-top: 10px;">
            From all of us at Blessed Two Electronics
          </p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <p style="font-size: 18px; line-height: 1.6; color: #4b5563; margin-bottom: 30px;">
            Dear <strong>${name}</strong>,<br><br>
            We hope your special day is filled with joy and wonderful moments! 
            To celebrate you, we're delighted to send you a birthday gift...
          </p>
          
          <!-- Points Card -->
          <div class="points-card">
            <div style="font-size: 24px; color: #92400e; font-weight: 600;">🎁 Your Birthday Gift</div>
            <div class="points-number">${points.toLocaleString()} Points</div>
            <p style="color: #92400e; margin: 0;">
              Loyalty points have been added to your account!
            </p>
          </div>
          
          ${
            customMessage
              ? `
          <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #0369a1; font-style: italic; margin: 0;">
              "${customMessage}"
            </p>
          </div>
          `
              : ""
          }
          
          <!-- How to Use Points -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/products" class="button">
              🛍️ Shop Now with Your Points
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              Points can be applied at checkout for instant discounts
            </p>
          </div>
          
          <!-- Tier Benefits -->
          <div class="benefits">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px;">⭐ Your ${tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : "Bronze"} Tier Benefits:</h3>
            <p style="color: #4b5563; margin: 0;">
              ${benefit}
            </p>
          </div>
          
          <!-- Store Info -->
          <div class="store-info">
            <h4 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">🏢 Visit Us to Celebrate:</h4>
            <p style="color: #4b5563; margin: 0 0 10px 0;">
              <strong>Blessed Two Electronics</strong><br>
              Duruma Road, Nairobi<br>
              📞 0727 833 691
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Mention your birthday at checkout for an extra surprise! 🎉
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p style="margin-bottom: 5px;">
            © ${new Date().getFullYear()} Blessed Two Electronics. All rights reserved.
          </p>
          <p style="margin: 0;">
            Duruma Road, Nairobi, Kenya | 
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/contact" style="color: #ec4899; text-decoration: none;">Contact Us</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
