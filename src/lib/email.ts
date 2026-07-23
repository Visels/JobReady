import { buildWelcomeEmail } from "../../emails/templates/welcome-email";
import { getAbsoluteUrl } from "@/lib/site-url";

const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";
const RESEND_CONTACTS_ENDPOINT = "https://api.resend.com/contacts";
const DEFAULT_SUPPORT_EMAIL = "support@visainterview.ai";

let missingEmailConfigWarned = false;
let missingContactConfigWarned = false;

type EmailTag = {
  name: string;
  value: string;
};

type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  idempotencyKey?: string;
  tags?: EmailTag[];
};

type SendEmailResult =
  | { status: "sent"; id?: string }
  | { status: "skipped"; reason: "missing_config" };

type CreateContactResult =
  | { status: "created"; id?: string }
  | { status: "exists" }
  | { status: "skipped"; reason: "missing_config" };

type ResendResponseBody = {
  id?: unknown;
  message?: unknown;
  name?: unknown;
  error?: unknown;
};

function cleanEnv(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function getEmailConfig({ warnIfMissing = false } = {}) {
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  const from = cleanEnv(process.env.RESEND_FROM_EMAIL) ?? cleanEnv(process.env.EMAIL_FROM);
  const replyTo = cleanEnv(process.env.RESEND_REPLY_TO_EMAIL);

  if (!apiKey || !from) {
    if (warnIfMissing && !missingEmailConfigWarned) {
      console.warn(
        "Resend email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL to enable transactional emails.",
      );
      missingEmailConfigWarned = true;
    }

    return null;
  }

  return { apiKey, from, replyTo };
}

function getResendApiConfig({ warnIfMissing = false } = {}) {
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);

  if (!apiKey) {
    if (warnIfMissing && !missingContactConfigWarned) {
      console.warn(
        "Resend contacts are not configured. Set RESEND_API_KEY to create broadcast contacts.",
      );
      missingContactConfigWarned = true;
    }

    return null;
  }

  return { apiKey };
}

export function hasTransactionalEmailConfig() {
  return getEmailConfig({ warnIfMissing: true }) !== null;
}

export function hasResendContactConfig() {
  return getResendApiConfig({ warnIfMissing: true }) !== null;
}

function resendErrorMessage(response: Response, body: ResendResponseBody | null) {
  if (typeof body?.message === "string" && body.message.trim()) {
    return body.message;
  }

  if (typeof body?.error === "string" && body.error.trim()) {
    return body.error;
  }

  return `${response.status} ${response.statusText}`.trim();
}

async function parseResendResponse(response: Response) {
  try {
    return (await response.json()) as ResendResponseBody;
  } catch {
    return null;
  }
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<SendEmailResult> {
  const config = getEmailConfig({ warnIfMissing: true });

  if (!config) {
    return { status: "skipped", reason: "missing_config" };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  if (input.idempotencyKey) {
    headers["Idempotency-Key"] = input.idempotencyKey;
  }

  const response = await fetch(RESEND_EMAIL_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: config.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo ?? config.replyTo,
      tags: input.tags,
    }),
  });
  const body = await parseResendResponse(response);

  if (!response.ok) {
    throw new Error(`Resend email failed: ${resendErrorMessage(response, body)}`);
  }

  return {
    status: "sent",
    id: typeof body?.id === "string" ? body.id : undefined,
  };
}

export async function sendWelcomeEmail(input: {
  userId: string;
  to: string;
  name?: string | null;
}) {
  const supportEmail =
    cleanEnv(process.env.RESEND_REPLY_TO_EMAIL) ??
    cleanEnv(process.env.SUPPORT_EMAIL) ??
    DEFAULT_SUPPORT_EMAIL;
  const email = buildWelcomeEmail({
    name: input.name,
    appUrl: getAbsoluteUrl("/"),
    practiceUrl: getAbsoluteUrl("/practice"),
    learningUrl: getAbsoluteUrl("/learning"),
    supportEmail,
  });

  return sendTransactionalEmail({
    to: input.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    idempotencyKey: `welcome-email-${input.userId}`,
    tags: [
      { name: "type", value: "welcome" },
      { name: "user_id", value: input.userId },
    ],
  });
}

function splitContactName(name?: string | null) {
  const normalized = name?.trim();

  if (!normalized) {
    return { firstName: undefined, lastName: undefined };
  }

  const [firstName, ...rest] = normalized.split(/\s+/);
  const lastName = rest.join(" ") || undefined;

  return { firstName, lastName };
}

function resendContactAlreadyExists(
  response: Response,
  body: ResendResponseBody | null,
) {
  const message =
    typeof body?.message === "string"
      ? body.message
      : typeof body?.error === "string"
        ? body.error
        : "";

  return response.status === 409 || message.toLowerCase().includes("already");
}

export async function createResendContact(input: {
  email: string;
  name?: string | null;
}): Promise<CreateContactResult> {
  const config = getResendApiConfig({ warnIfMissing: true });

  if (!config) {
    return { status: "skipped", reason: "missing_config" };
  }

  const { firstName, lastName } = splitContactName(input.name);
  const response = await fetch(RESEND_CONTACTS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      first_name: firstName,
      last_name: lastName,
      unsubscribed: false,
    }),
  });
  const body = await parseResendResponse(response);

  if (!response.ok) {
    if (resendContactAlreadyExists(response, body)) {
      return { status: "exists" };
    }

    throw new Error(`Resend contact failed: ${resendErrorMessage(response, body)}`);
  }

  return {
    status: "created",
    id: typeof body?.id === "string" ? body.id : undefined,
  };
}
