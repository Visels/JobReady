export type WelcomeEmailTemplateInput = {
  name?: string | null;
  appUrl: string;
  workspaceUrl: string;
  jobsUrl: string;
  tailoringUrl: string;
  interviewUrl: string;
  supportEmail: string;
};

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function firstName(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed?.split(/\s+/)[0] || "there";
}

function assetUrl(appUrl: string, path: string) {
  try { return new URL(path, appUrl).toString(); }
  catch { return `${appUrl.replace(/\/$/, "")}${path}`; }
}

export function buildWelcomeEmail(input: WelcomeEmailTemplateInput) {
  const greetingName = escapeHtml(firstName(input.name));
  const appUrl = escapeHtml(input.appUrl);
  const workspaceUrl = escapeHtml(input.workspaceUrl);
  const supportEmail = escapeHtml(input.supportEmail);
  const logoUrl = escapeHtml(assetUrl(input.appUrl, "/brand/jiandae/wordmark.png"));
  const supportIconUrl = escapeHtml(assetUrl(input.appUrl, "/brand/jiandae/favicon.png"));
  const termsUrl = escapeHtml(assetUrl(input.appUrl, "/terms"));
  const privacyUrl = escapeHtml(assetUrl(input.appUrl, "/privacy"));
  const currentYear = new Date().getFullYear();

  const subject = "Welcome to Jiandae";
  const text = `Hi ${firstName(input.name)},

Thank you for joining Jiandae — your AI-powered partner in interview preparation and career growth.

We are excited to have you on board and cannot wait to help you prepare with confidence and land the job you deserve.

Practice smart: Realistic mock interviews tailored to the job you want.
Stand out: AI-tailored CVs and cover letters that get noticed.
Track progress: Get feedback, improve, and see how far you have come.

Go to your dashboard: ${input.workspaceUrl}

If you have any questions, reply to this email or contact ${input.supportEmail}.

Jiandae Ltd. | Nairobi, Kenya
Terms: ${assetUrl(input.appUrl, "/terms")}
Privacy: ${assetUrl(input.appUrl, "/privacy")}`;

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>${subject}</title>
  <style>
    html,body{margin:0!important;padding:0!important;width:100%!important;background:#f7f5f0}table{border-collapse:collapse!important;border-spacing:0!important;mso-table-lspace:0!important;mso-table-rspace:0!important}img{border:0;display:block;height:auto;line-height:100%;outline:none;text-decoration:none}a{text-decoration:none}.feature-column+.feature-column{border-left:1px solid #d7dfda}
    @media only screen and (max-width:680px){.outer-pad{padding:0!important}.email-shell{width:100%!important;border-radius:0!important}.section-pad{box-sizing:border-box!important;padding-left:24px!important;padding-right:24px!important}.welcome-title{font-size:38px!important;line-height:43px!important;letter-spacing:-1.4px!important}.stack{display:block!important;box-sizing:border-box!important;width:100%!important}.feature-column{border-left:0!important;border-top:1px solid #d7dfda;padding:24px 12px!important}.feature-column:first-child{border-top:0!important;padding-top:8px!important}.footer-copy,.footer-links{display:block!important;width:100%!important;text-align:center!important}.footer-links{padding-top:18px!important}.desktop-only{display:none!important}}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f7f5f0;">
  <div style="display:none;font-size:1px;color:#f7f5f0;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Your Jiandae workspace is ready. Prepare with confidence and track your progress.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f5f0"><tr><td class="outer-pad" align="center" style="padding:28px 16px;">
    <table role="presentation" class="email-shell" width="700" cellpadding="0" cellspacing="0" border="0" style="width:700px;max-width:700px;background-color:#ffffff;border-radius:16px;box-shadow:0 10px 32px rgba(28,55,43,0.08);overflow:hidden;">
      <tr><td class="section-pad" align="center" style="padding:38px 48px 34px;"><a href="${appUrl}" target="_blank" style="display:inline-block;"><img src="${logoUrl}" width="184" alt="Jiandae" style="width:184px;max-width:100%;margin:0 auto;"></a></td></tr>
      <tr><td class="section-pad" style="padding:0 48px;"><div style="height:1px;background-color:#dfe4e1;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>
      <tr><td class="section-pad" align="center" style="padding:46px 48px 38px;">
        <h1 class="welcome-title" style="margin:0;color:#003e2b;font-family:Arial,Helvetica,sans-serif;font-size:48px;font-weight:800;line-height:54px;letter-spacing:-2px;text-align:center;">Welcome to Jiandae!</h1>
        <div style="width:58px;height:4px;margin:25px auto 27px;background-color:#f4b000;border-radius:4px;font-size:1px;line-height:1px;">&nbsp;</div>
        <p style="margin:0;color:#073e2d;font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:700;line-height:28px;text-align:center;">Hi ${greetingName},</p>
        <p style="max-width:550px;margin:14px auto 0;color:#1d2733;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;text-align:center;">Thank you for joining Jiandae &ndash; your AI-powered partner in<br class="desktop-only"> interview preparation and career growth.</p>
        <p style="max-width:550px;margin:24px auto 0;color:#1d2733;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;text-align:center;">We&rsquo;re excited to have you on board and can&rsquo;t wait to help you<br class="desktop-only"> prepare with confidence and land the job you deserve.</p>
      </td></tr>
      <tr><td class="section-pad" style="padding:0 44px 34px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7faf7;border-radius:18px;overflow:hidden;"><tr>
        <td class="stack feature-column" width="33.33%" valign="top" align="center" style="padding:30px 18px 28px;"><div style="width:70px;height:70px;border-radius:50%;background-color:#e5efe7;color:#06432f;font-family:Arial,Helvetica,sans-serif;font-size:32px;line-height:70px;text-align:center;">&#128188;</div><p style="margin:19px 0 0;color:#073e2d;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;line-height:23px;text-align:center;">Practice smart</p><p style="margin:10px 0 0;color:#202831;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;text-align:center;">Realistic mock interviews tailored to the job you want.</p></td>
        <td class="stack feature-column" width="33.33%" valign="top" align="center" style="padding:30px 18px 28px;"><div style="width:70px;height:70px;border-radius:50%;background-color:#e5efe7;color:#06432f;font-family:Arial,Helvetica,sans-serif;font-size:32px;line-height:70px;text-align:center;">&#128196;</div><p style="margin:19px 0 0;color:#073e2d;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;line-height:23px;text-align:center;">Stand out</p><p style="margin:10px 0 0;color:#202831;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;text-align:center;">AI-tailored CVs and cover letters that get noticed.</p></td>
        <td class="stack feature-column" width="33.33%" valign="top" align="center" style="padding:30px 18px 28px;"><div style="width:70px;height:70px;border-radius:50%;background-color:#e5efe7;color:#06432f;font-family:Arial,Helvetica,sans-serif;font-size:36px;line-height:70px;text-align:center;">&#8599;</div><p style="margin:19px 0 0;color:#073e2d;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;line-height:23px;text-align:center;">Track progress</p><p style="margin:10px 0 0;color:#202831;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;text-align:center;">Get feedback, improve and see how far you&rsquo;ve come.</p></td>
      </tr></table></td></tr>
      <tr><td class="section-pad" align="center" style="padding:0 48px 34px;"><p style="margin:0 0 17px;color:#26313d;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:800;line-height:24px;text-align:center;">Ready to get started?</p><table role="presentation" width="78%" cellpadding="0" cellspacing="0" border="0" style="width:78%;"><tr><td align="center" bgcolor="#00533a" style="border-radius:8px;"><a href="${workspaceUrl}" target="_blank" style="display:block;padding:17px 24px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;line-height:24px;text-align:center;">Go to your dashboard</a></td></tr></table></td></tr>
      <tr><td class="section-pad" style="padding:0 48px;"><div style="height:1px;background-color:#dfe4e1;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>
      <tr><td class="section-pad" style="padding:26px 48px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="66" valign="middle"><img src="${supportIconUrl}" width="54" alt="" style="width:54px;border-radius:50%;"></td><td valign="middle"><p style="margin:0;color:#073e2d;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;line-height:22px;">We&rsquo;re here for you</p><p style="margin:6px 0 0;color:#25303c;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">If you have any questions, feel free to reply to this email. We&rsquo;re happy to help!</p></td></tr></table></td></tr>
      <tr><td class="section-pad" style="padding:0 48px;"><div style="height:1px;background-color:#dfe4e1;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>
      <tr><td class="section-pad" style="padding:25px 48px 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="footer-copy" valign="top" style="color:#4c5765;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;">&copy; ${currentYear} Jiandae. All rights reserved.<br>Jiandae Ltd. &nbsp;|&nbsp; Nairobi, Kenya</td><td class="footer-links" align="right" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;"><a href="mailto:${supportEmail}" style="color:#00533a;font-weight:700;">${supportEmail}</a></td></tr></table></td></tr>
      <tr><td align="center" style="padding:0 24px 25px;color:#00533a;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;"><a href="${termsUrl}" target="_blank" style="color:#00533a;">Terms and Conditions</a>&nbsp;&nbsp; | &nbsp;&nbsp;<a href="${privacyUrl}" target="_blank" style="color:#00533a;">Privacy Policy</a></td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;

  return { subject, html, text };
}
