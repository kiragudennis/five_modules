// app/api/contact/route.ts
import { resend, secureRatelimit } from "@/lib/limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secure = await secureRatelimit(request);
  if (!secure.success) {
    NextResponse.json({ error: "Too many requests" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Send notification to your team
    await resend.emails.send({
      from: "E-commerce Platform <notifications@noreply.worldsamma.org>",
      to: ["jngatia045@gmail.com"],
      subject: `New Business Inquiry: ${body.name} - ${
        body.business || "E-commerce Store"
      }`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">New Business Inquiry</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Custom E-commerce Solution Request</p>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <div style="background: white; border-radius: 8px; padding: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                Client Details
              </h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Name:</strong></td>
                  <td style="padding: 8px 0;">${body.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Phone:</strong></td>
                  <td style="padding: 8px 0;">
                    <a href="tel:${
                      body.phone
                    }" style="color: #3b82f6; text-decoration: none;">${
        body.phone
      }</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0;">
                    <a href="mailto:${
                      body.email
                    }" style="color: #3b82f6; text-decoration: none;">${
        body.email
      }</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Business:</strong></td>
                  <td style="padding: 8px 0;">
                    <span style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-size: 14px;">
                      ${body.business || "Not specified"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Est. Orders:</strong></td>
                  <td style="padding: 8px 0;">
                    <span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 14px;">
                      ${body.orders || "Not specified"}
                    </span>
                  </td>
                </tr>
              </table>
              
              <h3 style="color: #1f2937; margin-top: 25px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
                Project Details
              </h3>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-top: 10px;">
                <p style="margin: 0; color: #4b5563; line-height: 1.6;">
                  ${body.message || "No additional details provided."}
                </p>
              </div>
              
              <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <a href="https://wa.me/${body.phone.replace(/[^0-9]/g, "")}" 
                   style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                  💬 Reply via WhatsApp
                </a>
                <p style="margin-top: 15px; color: #6b7280; font-size: 14px;">
                  Inquiry received: ${new Date().toLocaleString("en-KE", {
                    timeZone: "Africa/Nairobi",
                  })}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Send professional confirmation to the client
    await resend.emails.send({
      from: "Northwind Systems <hello@noreply.worldsamma.org>",
      to: [body.email],
      subject: `Thanks for your interest in a custom e-commerce solution!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 40px 30px; text-align: center; color: white;">
            <h1 style="margin: 0 0 10px; font-size: 28px;">Thank You, ${body.name}!</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 18px;">
              Your custom e-commerce inquiry has been received
            </p>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="color: #4b5563; margin-top: 0;">
                We appreciate your interest in a custom-built online store for your business. Our team is reviewing your requirements and will contact you shortly.
              </p>
              
              <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #1e40af; margin-top: 0;">What Happens Next?</h3>
                <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;"><strong>Within 2 hours:</strong> Initial response from our team</li>
                  <li style="margin-bottom: 8px;"><strong>Within 24 hours:</strong> Detailed proposal & timeline</li>
                  <li style="margin-bottom: 8px;"><strong>Quick follow-up:</strong> Free 30-minute consultation call</li>
                </ol>
              </div>
              
              <div style="margin: 25px 0; padding: 20px; background: #fef7ff; border-radius: 8px; border: 1px solid #f3e8ff;">
                <h3 style="color: #7c3aed; margin-top: 0;">💡 While You Wait</h3>
                <p style="color: #6b7280; margin-bottom: 15px;">
                  Explore our demo store to see the capabilities you can expect:
                </p>
                <a href="https://first-shop-eta.vercel.app/" 
                   style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                  👉 View Demo Store
                </a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <h4 style="color: #1f2937; margin-top: 0;">Need Immediate Assistance?</h4>
                <p style="color: #6b7280;">
                  Contact us directly via WhatsApp for faster response:
                </p>
                <a href="https://wa.me/254113062599" 
                   style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; margin-top: 10px;">
                  💬 WhatsApp Our Team
                </a>
              </div>
              
              <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center;">
                <p style="color: #6b7280; margin: 0; font-size: 14px;">
                  <strong>Northwind Systems</strong><br>
                  Custom E-commerce Solutions for Kenyan Businesses<br>
                  M-Pesa Integration • Mobile-First Design • 24/7 Kenyan Support
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      {
        error:
          "We encountered an issue processing your request. Please try again or contact us directly via WhatsApp.",
      },
      { status: 500 }
    );
  }
}
