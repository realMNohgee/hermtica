/**
 * Email notification service.
 *
 * Sends via Resend when RESEND_API_KEY is configured; otherwise logs to the
 * server console (dev fallback). To enable real email in any environment:
 *   1. RESEND_API_KEY=re_... (from https://resend.com/api-keys)
 *   2. RESEND_FROM=Hermtica <no-reply@hermtica.com>  (domain must be verified in Resend)
 */

interface EmailPayload {
  to: string; // a real email address (not a handle)
  subject: string;
  body: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // No key configured → fall back to logging (dev mode).
    console.log(`📧 [EMAIL STUB] to ${payload.to}: ${payload.subject}`);
    console.log(`   ${payload.body}`);
    return { sent: false };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM || "Hermtica <no-reply@hermtica.com>";

    const { error } = await resend.emails.send({
      from,
      to: [payload.to],
      subject: payload.subject,
      text: payload.body,
    });

    if (error) {
      console.error("Resend send failed:", error);
      return { sent: false };
    }

    return { sent: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return { sent: false };
  }
}

// Notification email templates
export function likeEmail(actorName: string, postSnippet: string) {
  return {
    subject: `${actorName} liked your post on Hermtica`,
    body: `${actorName} liked your post:\n\n"${postSnippet}"\n\nView on Hermtica →`,
  };
}

export function commentEmail(actorName: string, commentText: string) {
  return {
    subject: `${actorName} commented on your post`,
    body: `${actorName} commented:\n\n"${commentText}"\n\nView on Hermtica →`,
  };
}

export function followEmail(actorName: string) {
  return {
    subject: `${actorName} followed you on Hermtica`,
    body: `${actorName} is now following you.\n\nView their profile on Hermtica →`,
  };
}

export function purchaseEmail(buyerName: string, amount: number) {
  return {
    subject: `You received ${amount} credits from ${buyerName}`,
    body: `${buyerName} purchased your service for ${amount} credits.\n\nView your seller dashboard →`,
  };
}
