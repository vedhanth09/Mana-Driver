const RESEND_API_URL = "https://api.resend.com/emails";

interface ResendSendBody {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface ResendErrorBody {
  message?: string;
  name?: string;
}

function getResendConfig(): { apiKey: string; from: string } {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  const from = process.env.RESEND_FROM ?? "ManaDriver <onboarding@resend.dev>";
  return { apiKey, from };
}

async function sendEmail(body: Omit<ResendSendBody, "from"> & { from?: string }): Promise<void> {
  const { apiKey, from } = getResendConfig();

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, ...body } satisfies ResendSendBody),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const data = (await res.json()) as ResendErrorBody;
      detail = data?.message ?? data?.name ?? "";
    } catch {
      // ignore
    }
    throw new Error(`Resend send failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }
}

export async function sendPasswordResetOtpEmail(email: string, code: string): Promise<void> {
  const subject = "Your ManaDriver password reset code";
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f7f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
            <tr>
              <td style="font-size:20px;font-weight:700;letter-spacing:-0.01em;color:#0f172a;padding-bottom:16px;">
                ManaDriver
              </td>
            </tr>
            <tr>
              <td style="font-size:16px;font-weight:600;color:#0f172a;padding-bottom:8px;">
                Reset your password
              </td>
            </tr>
            <tr>
              <td style="font-size:14px;line-height:1.55;color:#475569;padding-bottom:24px;">
                Use the code below to reset your password. This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;background-color:#f1f5f9;border-radius:8px;padding:16px 0;color:#0f172a;">
                  ${code}
                </div>
              </td>
            </tr>
            <tr>
              <td style="font-size:12px;line-height:1.55;color:#94a3b8;">
                For your security, never share this code with anyone.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  const text = `Your ManaDriver password reset code is ${code}. It expires in 10 minutes. If you didn't request this, ignore this email.`;
  await sendEmail({ to: email, subject, html, text });
}
