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
  const workspaceUrl = escapeHtml(input.workspaceUrl);
  const jobsUrl = escapeHtml(input.jobsUrl);
  const tailoringUrl = escapeHtml(input.tailoringUrl);
  const interviewUrl = escapeHtml(input.interviewUrl);
  const supportEmail = escapeHtml(input.supportEmail);
  const logoUrl = escapeHtml(
    assetUrl(input.appUrl, "/brand/jobready/wordmark-light.svg"),
  );

  const subject = "Welcome to Jobready";
  const text = `Hi ${firstName(input.name)},

Welcome to Jobready. Your private workspace helps you find sourced jobs, tailor CV/resume versions truthfully, practise realistic job interviews, and track applications.

Here is what you can do:

- Search public jobs with source, location, freshness, deadline, and official application links.
- Tailor an existing CV/resume without inventing facts, employers, titles, dates, or achievements.
- Practise company and role interviews with evidence-backed feedback.
- Track saved jobs and applications privately in your workspace.

Open your workspace: ${input.workspaceUrl}
Search jobs: ${input.jobsUrl}
Tailor a CV/resume: ${input.tailoringUrl}
Practise an interview: ${input.interviewUrl}

If you need help, reply to this email or contact ${input.supportEmail}.

Jobready`;

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>${subject}</title>
  <style>
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; background: #fcfcfa; }
    table { border-collapse: collapse !important; border-spacing: 0 !important; mso-table-lspace: 0 !important; mso-table-rspace: 0 !important; }
    img { border: 0; display: block; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { text-decoration: none; }
    @media only screen and (max-width: 700px) {
      .email-shell { width: 100% !important; }
      .section-pad { box-sizing: border-box !important; padding-left: 22px !important; padding-right: 22px !important; }
      .welcome-title { font-size: 36px !important; line-height: 40px !important; }
      .stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#fcfcfa;">
  <div style="display:none;font-size:1px;color:#fcfcfa;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Welcome to Jobready. Find roles, prepare truthful applications, and practise interviews.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fcfcfa">
    <tr>
      <td align="center" style="padding:22px 0;">
        <table role="presentation" class="email-shell" width="700" cellpadding="0" cellspacing="0" border="0" style="width:700px;max-width:700px;background-color:#fffaf3;border:1px solid #dce4df;">
          <tr>
            <td class="section-pad" align="left" style="padding:34px 48px 18px;">
              <a href="${appUrl}" target="_blank">
                <img src="${logoUrl}" width="172" alt="jobready" style="width:172px;max-width:100%;">
              </a>
            </td>
          </tr>
          <tr>
            <td class="section-pad" style="padding:0 48px 34px;">
              <span style="display:inline-block;padding:7px 12px;background-color:#eaf4ef;border-radius:999px;color:#00533a;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;line-height:16px;letter-spacing:2px;text-transform:uppercase;">
                Workspace ready
              </span>
              <h1 class="welcome-title" style="margin:18px 0 0;color:#071512;font-family:Arial,Helvetica,sans-serif;font-size:50px;font-weight:800;line-height:54px;letter-spacing:-2px;">
                Welcome, <span style="color:#00533a;">${greetingName}</span>
              </h1>
              <p style="margin:18px 0 0;color:#53605a;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:29px;">
                Jobready helps you move from sourced jobs to truthful CV/resume tailoring, realistic interview practice, and private application tracking.
              </p>
            </td>
          </tr>
          <tr>
            <td class="section-pad" align="left" style="padding:0 48px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#00533a" style="border-radius:999px;">
                    <a href="${workspaceUrl}" target="_blank" style="display:inline-block;padding:16px 28px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:800;line-height:20px;white-space:nowrap;">
                      Open workspace &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="section-pad" style="padding:34px 48px;background-color:#ffffff;border-top:1px solid #dce4df;border-bottom:1px solid #dce4df;">
              <p style="margin:0 0 18px;color:#071512;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;line-height:30px;">
                Three ways to start
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="stack" width="33.33%" valign="top" style="padding:0 10px 14px 0;">
                    <p style="margin:0;color:#d8a12e;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;">01</p>
                    <p style="margin:6px 0 0;color:#071512;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:800;line-height:22px;">Find jobs</p>
                    <p style="margin:6px 0 0;color:#53605a;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">Review source, location, deadline, freshness, and official apply links.</p>
                  </td>
                  <td class="stack" width="33.33%" valign="top" style="padding:0 10px 14px;">
                    <p style="margin:0;color:#d8a12e;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;">02</p>
                    <p style="margin:6px 0 0;color:#071512;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:800;line-height:22px;">Tailor CV/resume</p>
                    <p style="margin:6px 0 0;color:#53605a;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">Improve fit and clarity without inventing facts.</p>
                  </td>
                  <td class="stack" width="33.33%" valign="top" style="padding:0 0 14px 10px;">
                    <p style="margin:0;color:#d8a12e;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;">03</p>
                    <p style="margin:6px 0 0;color:#071512;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:800;line-height:22px;">Practise interviews</p>
                    <p style="margin:6px 0 0;color:#53605a;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">Use role and company context with evidence-backed feedback.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="section-pad" style="padding:32px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="stack" valign="top" style="padding:0 8px 12px 0;">
                    <a href="${jobsUrl}" target="_blank" style="display:block;padding:14px 16px;border:1px solid #dce4df;border-radius:16px;color:#00533a;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;">Search jobs</a>
                  </td>
                  <td class="stack" valign="top" style="padding:0 8px 12px;">
                    <a href="${tailoringUrl}" target="_blank" style="display:block;padding:14px 16px;border:1px solid #dce4df;border-radius:16px;color:#00533a;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;">Tailor CV/resume</a>
                  </td>
                  <td class="stack" valign="top" style="padding:0 0 12px 8px;">
                    <a href="${interviewUrl}" target="_blank" style="display:block;padding:14px 16px;border:1px solid #dce4df;border-radius:16px;color:#00533a;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;">Practise interview</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="section-pad" align="center" bgcolor="#063c31" style="padding:34px 48px;background-color:#063c31;">
              <p style="margin:0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;line-height:30px;text-align:center;">
                Official application access stays public.
              </p>
              <p style="margin:10px 0 0;color:#c9ddd5;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:24px;text-align:center;">
                Preparation credits are for optional mock interviews and CV/resume tailoring. Jobready does not submit applications for you.
              </p>
            </td>
          </tr>
          <tr>
            <td class="section-pad" align="center" style="padding:28px 40px 34px;background-color:#fffaf3;">
              <p style="margin:0 0 6px;color:#748079;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;text-align:center;">
                Need help? Reply to this email or contact <a href="mailto:${supportEmail}" style="color:#00533a;font-weight:800;text-decoration:underline;">${supportEmail}</a>.
              </p>
              <p style="margin:0;color:#748079;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;text-align:center;">
                You received this email because you created a Jobready account.
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
