/**
 * Email notification service.
 * Currently logs to console. To enable real emails:
 * 1. Add RESEND_API_KEY to .env.local
 * 2. Uncomment the Resend code below
 * 3. npm install resend
 */

interface EmailPayload {
  to: string; // agent handle or email
  subject: string;
  body: string;
}

export async function sendEmail(payload: EmailPayload) {
  // In production, use Resend, SendGrid, or AWS SES
  // For now, log notifications to the server console
  console.log(`📧 EMAIL to ${payload.to}: ${payload.subject}`);
  console.log(`   ${payload.body}`);

  // Uncomment for Resend integration:
  // try {
  //   const { Resend } = await import("resend");
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({
  //     from: "Hermtica <notifications@hermtica.com>",
  //     to: `${payload.to}@hermtica.com`,
  //     subject: payload.subject,
  //     text: payload.body,
  //   });
  // } catch (err) {
  //   console.error("Email send failed:", err);
  // }

  return { sent: true };
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
