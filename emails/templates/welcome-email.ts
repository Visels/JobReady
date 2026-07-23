export type WelcomeEmailTemplateInput = {
  name?: string | null;
  appUrl: string;
  practiceUrl: string;
  learningUrl: string;
  supportEmail: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstName(name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return "there";

  return trimmed.split(/\s+/)[0] || "there";
}

function assetUrl(appUrl: string, path: string) {
  try {
    return new URL(path, appUrl).toString();
  } catch {
    return `${appUrl.replace(/\/$/, "")}${path}`;
  }
}

export function buildWelcomeEmail(input: WelcomeEmailTemplateInput) {
  const greetingName = escapeHtml(firstName(input.name));
  const appUrl = escapeHtml(input.appUrl);
  const practiceUrl = escapeHtml(input.practiceUrl);
  const learningUrl = escapeHtml(input.learningUrl);
  const supportEmail = escapeHtml(input.supportEmail);
  const logoUrl = escapeHtml(assetUrl(input.appUrl, "/assets/black-lg-logo.png"));
  const interviewImageUrl = escapeHtml(
    assetUrl(input.appUrl, "/marketing/interview-room.png"),
  );

  const subject = "Welcome to VisaInterview.ai";
  const text = `Hi ${firstName(input.name)},

Welcome to VisaInterview.ai. The platform helps you prepare for visa interviews with private AI-powered practice sessions that adapt to your visa type, destination, background, prior refusals, and specific concerns.

Here is what you can do:

- Start a realistic mock interview and answer one officer-style question at a time.
- Practice around the details that matter for your application, including study plans, work purpose, home ties, funding, travel history, and refusal history.
- Get a structured readiness report after a completed session with strengths, weak spots, and practical suggestions.
- Use the learning center and visa guides to review requirements, documents, and common interview traps before you practice.

Start practicing: ${input.practiceUrl}
Explore learning resources: ${input.learningUrl}

If you need help, reply to this email or contact ${input.supportEmail}.

VisaInterview.ai`;

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>${subject}</title>
  <style>
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; background: #fdfbf8; }
    table { border-collapse: collapse !important; border-spacing: 0 !important; mso-table-lspace: 0 !important; mso-table-rspace: 0 !important; }
    img { border: 0; display: block; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { text-decoration: none; }
    @media only screen and (max-width: 700px) {
      .email-shell { width: 100% !important; }
      .section-pad { box-sizing: border-box !important; padding-left: 22px !important; padding-right: 22px !important; }
      .welcome-title { font-size: 34px !important; line-height: 40px !important; }
      .fluid-image { width: 100% !important; height: auto !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#fdfbf8;">
  <div style="display:none;font-size:1px;color:#fdfbf8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Welcome to VisaInterview.ai. Your personalized interview practice starts here.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fdfbf8">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" class="email-shell" width="700" cellpadding="0" cellspacing="0" border="0" style="width:700px;max-width:700px;background-color:#f6f2ea;">
          <tr>
            <td class="section-pad" align="center" style="padding:38px 48px 22px;">
              <a href="${appUrl}" target="_blank">
                <img src="${logoUrl}" width="220" alt="VisaInterview.ai" style="width:220px;max-width:100%;">
              </a>
            </td>
          </tr>
          <tr>
            <td class="section-pad" align="center" style="padding:0 48px 12px;">
              <span style="display:inline-block;padding:4px 12px;background-color:#ffffff;border-radius:4px;color:#101112;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;line-height:16px;letter-spacing:2px;">
                WELCOME ABOARD
              </span>
            </td>
          </tr>
          <tr>
            <td class="section-pad" align="center" style="padding:0 48px;">
              <h1 class="welcome-title" style="margin:0;color:#090a0b;font-family:Arial,Helvetica,sans-serif;font-size:46px;font-weight:700;line-height:54px;letter-spacing:0;text-align:center;">
                Welcome, <span style="color:#fb421f;">${greetingName}</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td class="section-pad" align="center" style="padding:14px 62px 24px;">
              <p style="margin:0;color:#353535;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:28px;text-align:center;">
                You are in. VisaInterview.ai gives you private, AI-powered practice tailored to your visa type, destination, background, prior refusals, and specific concerns.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 24px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#00533f" style="border-radius:28px;">
                    <a href="${practiceUrl}" target="_blank" style="display:inline-block;padding:15px 30px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;line-height:20px;white-space:nowrap;">
                      Start practicing &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="section-pad" align="center" style="padding:0 60px 44px;">
              <a href="${practiceUrl}" target="_blank">
                <img class="fluid-image" src="${interviewImageUrl}" alt="VisaInterview.ai mock interview room" style="width:100%;max-width:580px;border-radius:16px;">
              </a>
            </td>
          </tr>
          <tr>
            <td class="section-pad" style="padding:42px 54px;background-color:#f8eee8;">
              <p style="margin:0 0 18px;color:#090a0b;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;line-height:30px;">
                What you can do next
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="34" valign="top" style="padding:2px 0 16px;color:#fb421f;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;">01</td>
                  <td valign="top" style="padding:0 0 16px;color:#535353;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;">Start a realistic mock interview and answer one officer-style question at a time.</td>
                </tr>
                <tr>
                  <td width="34" valign="top" style="padding:2px 0 16px;color:#fb421f;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;">02</td>
                  <td valign="top" style="padding:0 0 16px;color:#535353;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;">Practice around your purpose, funding, home ties, travel history, and refusal history.</td>
                </tr>
                <tr>
                  <td width="34" valign="top" style="padding:2px 0 16px;color:#fb421f;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;">03</td>
                  <td valign="top" style="padding:0 0 16px;color:#535353;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;">Get a structured readiness report with strengths, weak spots, and practical suggestions.</td>
                </tr>
                <tr>
                  <td width="34" valign="top" style="padding:2px 0 0;color:#fb421f;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;">04</td>
                  <td valign="top" style="padding:0;color:#535353;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;">Use the learning center and visa guides to review requirements before you practice.</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="section-pad" align="center" bgcolor="#090a0b" style="padding:42px 54px;background-color:#090a0b;">
              <h2 style="margin:0 0 10px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:27px;font-weight:700;line-height:34px;text-align:center;">
                Prepare with a plan, not guesswork.
              </h2>
              <p style="margin:0 0 22px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;text-align:center;">
                Review visa guides, document pointers, and answer strategies before your next practice session.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#ffffff" style="border-radius:28px;">
                    <a href="${learningUrl}" target="_blank" style="display:inline-block;padding:14px 27px;color:#090a0b;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:20px;white-space:nowrap;">
                      Explore learning resources &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="section-pad" align="center" style="padding:30px 40px 12px;background-color:#f6f2ea;">
              <a href="${appUrl}" target="_blank">
                <img src="${logoUrl}" width="140" alt="VisaInterview.ai" style="width:140px;max-width:100%;">
              </a>
            </td>
          </tr>
          <tr>
            <td class="section-pad" align="center" style="padding:0 40px 32px;background-color:#f6f2ea;">
              <p style="margin:0 0 5px;color:#737373;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;text-align:center;">
                Need help? Reply to this email or contact <a href="mailto:${supportEmail}" style="color:#00533f;font-weight:700;text-decoration:underline;">${supportEmail}</a>.
              </p>
              <p style="margin:0;color:#737373;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;text-align:center;">
                You received this email because you created a VisaInterview.ai account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
