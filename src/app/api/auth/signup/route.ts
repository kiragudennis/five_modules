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

      // In your signup endpoint, update the referral insertion:
      if (referralCode && !referrerError && referrerData) {
        const { error: referralError } = await supabaseAdmin
          .from("referrals")
          .insert({
            referrer_id: referrerData.id,
            referred_email: email,
            referred_user_id: userId,
            referral_code: referralCode.toUpperCase(),
            status: "joined", // Waiting for activation
            reward_points: 100,
            conversion_type: "signup", // ✅ Changed from "account_creation" to "signup"
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

        if (referralError) {
          console.error("Referral insertion error:", referralError);
          // Not critical, so we won't throw an error here
        }
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

    // Send email
    await resend.emails.send({
      from: `Northwind Systems <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: `✨ Welcome to Northwind Systems - Verify Your Email`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Northwind Systems</title>
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; background: #fefefe; padding: 40px; color: #333; max-width: 600px; margin: auto;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding-bottom: 20px;">
      <div style="background: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto;">
        <table width="100%" height="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" valign="middle">
              <img
                src="${process.env.NEXT_PUBLIC_SITE_URL}/favicon-32x32.png"
                alt="Northwind Systems"
                style="width: 32px; height: 32px; border-radius: 8px; display: block;"
                width="32"
                height="32"
              />
            </td>
          </tr>
        </table>
      </div>
    </td>
  </tr>
</table>
            <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0;">Welcome to Northwind Systems!</h1>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 30px;">
              Hi <strong>${name}</strong>,<br><br>
              Thank you for joining Northwind Systems — the complete e-commerce platform with 5 gamified engagement modules!
            </p>
            
            <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
              <h3 style="color: #1e40af; margin-top: 0;">🎁 Your Welcome Bonus:</h3>
              <p style="margin-bottom: 10px; color: #1e40af;">Use code <strong style="background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-size: 18px;">WELCOME15</strong> to get 15% off your first order!</p>
              <p style="margin-bottom: 0; color: #1e40af; font-size: 14px;">+ 100 bonus loyalty points to start!</p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationLink}" 
                 style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                ✅ Verify My Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 30px;">
              This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; margin-top: 30px;">
              <h4 style="color: #1f2937; margin-bottom: 15px;">🎮 What You Get as a Member:</h4>
              <ul style="color: #4b5563; padding-left: 20px; margin-bottom: 30px;">
                <li style="margin-bottom: 8px;">🎡 <strong>Spin to Win</strong> - Daily free spins for points and prizes</li>
                <li style="margin-bottom: 8px;">🏆 <strong>Live Challenges</strong> - Compete in real-time trivia and competitions</li>
                <li style="margin-bottom: 8px;">🎫 <strong>Lucky Draws</strong> - Enter giveaways with multiple entry methods</li>
                <li style="margin-bottom: 8px;">🎁 <strong>Mystery Bundles</strong> - Curated products with surprise reveals</li>
                <li style="margin-bottom: 8px;">⚡ <strong>Flash Deals</strong> - Limited-time offers with live countdowns</li>
                <li style="margin-bottom: 8px;">💰 <strong>Loyalty Points</strong> - Earn points on every purchase, redeem for discounts</li>
                <li style="margin-bottom: 8px;">👑 <strong>Tier Benefits</strong> - Unlock Silver, Gold, and Platinum rewards</li>
              </ul>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h4 style="color: #1f2937; margin-top: 0; margin-bottom: 10px;">📺 Live Broadcast Ready:</h4>
                <p style="margin: 0; color: #4b5563;">
                  Every module includes OBS-friendly displays. Host live streams on TikTok, Instagram, or YouTube while the system handles the heavy lifting — stock updates, payments, and winner selection automatically.
                </p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 5px;">
              © ${new Date().getFullYear()} Northwind Systems. All rights reserved.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/about" style="color: #2563eb; text-decoration: none;">About Us</a> | 
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/about/module/consultation" style="color: #2563eb; text-decoration: none;">Enterprise Consultation</a> | 
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/about/module" style="color: #2563eb; text-decoration: none;">Learn More of Our Modules</a>
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
