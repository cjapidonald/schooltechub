export interface EmailContent {
  subject: string;
  text: string;
  html?: string;
}

interface SendEmailPayload extends EmailContent {
  to: string;
}

function getResendConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY ?? "";
  const from =
    process.env.NOTIFICATION_FROM_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    process.env.EMAIL_SENDER ??
    "";

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

export async function sendEmail(payload: SendEmailPayload): Promise<boolean> {
  const resendConfig = getResendConfig();
  if (!resendConfig) {
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendConfig.from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html ?? `<p>${payload.text}</p>`,
      }),
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
