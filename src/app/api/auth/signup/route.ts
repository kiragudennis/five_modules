// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { secureRatelimit, resend } from "@/lib/limit";
import { validateSignUp } from "@/types/customer";
import { checkBotId } from "botid/server";

export async function POST(req: Request) {
  try {
    const verification = await checkBotId();

    if (verification.isBot) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { success } = await secureRatelimit(req);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const data = await req.json();
    const parsed = validateSignUp.safeParse(data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data provided" },
        { status: 400 },
      );
    }

    const {
      fullName,
      email,
      phone,
      password,
      address,
      city,
      postalCode,
      businessName,
      businessType,
      receiveOffers,
      receiveNewsletter,
      referralCode,
    } = parsed.data;

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          full_name: fullName,
          phone,
          city,
          business_customer: !!businessName,
        },
      });

    if (authError || !authData.user) {
      console.error("Auth creation error:", authError);
      throw new Error(authError?.message || "Failed to create user");
    }

    const userId = authData.user.id;

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from("users")
      .update({
        full_name: fullName,
        phone,
        address,
        city,
        postal_code: postalCode,
        business_name: businessName,
        business_type: businessType,
        receive_offers: receiveOffers,
        receive_newsletter: receiveNewsletter,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    // Handle referral code if provided
    if (referralCode) {
      // Find the referrer
      const { data: referrerData, error: referrerError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("referral_code", referralCode.toUpperCase())
        .single();

      if (!referrerError && referrerData) {
        // Record the referral (pending status)
        await supabaseAdmin.from("referrals").insert({
          referrer_id: referrerData.id,
          referred_email: email,
          referred_user_id: userId,
          referral_code: referralCode.toUpperCase(),
          status: "joined", // They've joined, waiting for first purchase
          reward_points: 100, // Default points
          metadata: {
            joined_at: new Date().toISOString(),
            signup_data: {
              full_name: fullName,
              phone: phone,
              city: city,
              is_business: !!businessName,
            },
          },
        });
      }
    }

    // Send verification email
    await sendVerificationEmail(email, fullName);

    return NextResponse.json({
      success: true,
      message:
        "Account created! Please check your email to verify your account.",
      userId,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

async function sendVerificationEmail(email: string, name: string) {
  try {
    // ✅ CRITICAL: Add redirectTo option
    const { data: linkData, error } =
      await supabaseAdmin.auth.admin.generateLink({
        email,
        type: "magiclink",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm-signup`,
        },
      });

    if (error || !linkData?.properties?.action_link) {
      console.error("Magic link generation failed:", error);
      return NextResponse.json(
        { error: "Magic link not generated" },
        { status: 500 },
      );
    }

    let verificationLink = linkData.properties.action_link;

    // parse URL
    const url = new URL(verificationLink);

    // override redirect_to to your client callback
    url.searchParams.set(
      "redirect_to",
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm-signup`,
    );

    verificationLink = url.toString();

    await resend.emails.send({
      from: `Blessed Two Electronics <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: `✨ Welcome to Blessed Two Electronics - Verify Your Email`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Blessed Two Electronics</title>
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; background: #fefefe; padding: 40px; color: #333; max-width: 600px; margin: auto;">
          <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <div style="background: white; width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <div style="font-size: 40px; color: #f59e0b;">💡</div>
            </div>
            <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0;">Welcome to Blessed Two Electronics!</h1>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 30px;">
              Hi <strong>${name}</strong>,<br><br>
              Thank you for joining Nairobi's premier lighting destination! We're excited to have you as part of our community.
            </p>
            
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
              <h3 style="color: #92400e; margin-top: 0;">🎁 Your Welcome Gift:</h3>
              <p style="margin-bottom: 10px; color: #92400e;">Use code <strong style="background: #fef3c7; padding: 4px 8px; border-radius: 4px; font-size: 18px;">WELCOME15</strong> to get 15% off your first order!</p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationLink}" 
                 style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                ✅ Verify My Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 30px;">
              This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; margin-top: 30px;">
              <h4 style="color: #1f2937; margin-bottom: 15px;">💡 What You Get as a Member:</h4>
              <ul style="color: #4b5563; padding-left: 20px; margin-bottom: 30px;">
                <li style="margin-bottom: 8px;">🎯 Exclusive member-only discounts & early access to sales</li>
                <li style="margin-bottom: 8px;">🚚 Free same-day delivery in Nairobi (orders over KES 3,000)</li>
                <li style="margin-bottom: 8px;">⭐ Priority customer support from our lighting experts</li>
                <li style="margin-bottom: 8px;">📦 Order tracking and easy reordering</li>
                <li style="margin-bottom: 8px;">🔧 Free installation consultation for complex lighting projects</li>
              </ul>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h4 style="color: #1f2937; margin-top: 0; margin-bottom: 10px;">🏢 Visit Our Store:</h4>
                <p style="margin: 0; color: #4b5563;">
                  <strong>Blessed Two Electronics</strong><br>
                  Duruma Road, Nairobi<br>
                  📞 0727 833 691<br>
                  🕗 Mon-Sat: 8AM-6PM | Sun: 10AM-4PM
                </p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 5px;">
              © ${new Date().getFullYear()} Blessed Two Electronics. All rights reserved.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Duruma Road, Nairobi, Kenya | 
              <a href="${
                process.env.NEXT_PUBLIC_SITE_URL
              }/contact" style="color: #f59e0b; text-decoration: none;">Contact Us</a> | 
              <a href="${
                process.env.NEXT_PUBLIC_SITE_URL
              }/privacy" style="color: #f59e0b; text-decoration: none;">Privacy Policy</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Verification email sent to:", email);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
}
