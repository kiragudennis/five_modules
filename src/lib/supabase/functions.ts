// supabase/functions/send-emails/index.ts
// This is a Supabase Edge Function that processes the email queue and sends out emails using Resend.
//@ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "./server";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  const { type } = await req.json();

  if (type === "process_queue") {
    const supabaseClient = createClient();

    const { data: pendingEmails } = await supabaseClient
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(50);

    let sent = 0;
    let failed = 0;

    for (const email of pendingEmails || []) {
      try {
        await resend.emails.send({
          from: "noreply@yourstore.com",
          to: email.to_email,
          subject: email.subject,
          html: email.html_content,
          text: email.text_content,
        });

        await supabaseClient
          .from("email_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", email.id);

        sent++;
      } catch (error) {
        const retryCount = (email.retry_count || 0) + 1;
        await supabaseClient
          .from("email_queue")
          .update({
            status: retryCount >= 3 ? "failed" : "retry",
            retry_count: retryCount,
            error_message: error.message,
          })
          .eq("id", email.id);

        failed++;
      }
    }

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid request" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
});
