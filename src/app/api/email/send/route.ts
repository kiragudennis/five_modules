// app/api/email/send/route.ts
import { resend, secureRatelimit } from "@/lib/limit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Rate limiting
  const { success } = await secureRatelimit(request);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { to, subject, template, data } = await request.json();

    const templates: Record<string, string> = {
      birthday: generateBirthdayTemplate(data),
      promotion: generatePromotionTemplate(data),
      announcement: generateAnnouncementTemplate(data),
      custom: generateCustomTemplate(data),
    };

    const html = templates[template] || templates.custom;

    const { data: resendData, error } = await resend.emails.send({
      from: "Blessed Two Electronics <@noreply.worldsamma.org>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: resendData });
  } catch (error: any) {
    console.error("Email error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateCustomTemplate(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Inter', Arial, sans-serif; background: #fefefe; padding: 40px; color: #333; max-width: 600px; margin: auto;">
      <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0;">Blessed Two Electronics</h1>
      </div>
      
      <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          ${data.message || "Thank you for being a valued customer!"}
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/products" 
             style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            🔥 Shop Now
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateBirthdayTemplate(data: any): string {
  return `...`;
}

function generatePromotionTemplate(data: any): string {
  return `...`; // Your promotion template
}

function generateAnnouncementTemplate(data: any): string {
  return `...`; // Your announcement template
}
