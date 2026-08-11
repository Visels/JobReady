import type { User } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

export type AdminRole = "owner" | "editor" | "reviewer" | "job_editor" | "analyst";

export type AdminPermission =
  | "admin:read"
  | "content:write"
  | "content:review"
  | "jobs:write"
  | "jobs:review"
  | "imports:dry_run"
  | "imports:apply"
  | "reports:read"
  | "audit:read";

export type AdminActor = {
  userId: string;
  email: string | null;
  roles: AdminRole[];
};

type AdminUserShape = Pick<User, "id" | "email">;
type AdminEnv = Record<string, string | undefined>;

const PERMISSIONS_BY_ROLE: Record<AdminRole, AdminPermission[]> = {
  owner: [
    "admin:read",
    "content:write",
    "content:review",
    "jobs:write",
    "jobs:review",
    "imports:dry_run",
    "imports:apply",
    "reports:read",
    "audit:read",
  ],
  editor: [
    "admin:read",
    "content:write",
    "content:review",
    "jobs:write",
    "jobs:review",
    "imports:dry_run",
    "imports:apply",
    "reports:read",
    "audit:read",
  ],
  reviewer: [
    "admin:read",
    "content:review",
    "jobs:review",
    "imports:dry_run",
    "reports:read",
    "audit:read",
  ],
  job_editor: [
    "admin:read",
    "jobs:write",
    "jobs:review",
    "imports:dry_run",
    "reports:read",
    "audit:read",
  ],
  analyst: ["admin:read", "imports:dry_run", "reports:read", "audit:read"],
};

export class AdminAuthorizationError extends Error {
  constructor(
    public readonly code: "unauthorized" | "forbidden",
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "AdminAuthorizationError";
  }
}

function parseAllowlist(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(/[\s,;]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

function addRole(roles: Set<AdminRole>, role: AdminRole) {
  roles.add(role);
}

export function adminActorFromUser(
  user: AdminUserShape | null,
  env: AdminEnv = process.env,
): AdminActor | null {
  if (!user) return null;

  const email = user.email?.trim().toLowerCase() ?? null;
  const userId = user.id.trim().toLowerCase();
  const roles = new Set<AdminRole>();
  const ownerEmails = parseAllowlist(env.JOBREADY_ADMIN_OWNER_EMAILS);
  const ownerUserIds = parseAllowlist(env.JOBREADY_ADMIN_OWNER_USER_IDS);
  const editorEmails = parseAllowlist(env.JOBREADY_ADMIN_EDITOR_EMAILS);
  const editorUserIds = parseAllowlist(env.JOBREADY_ADMIN_EDITOR_USER_IDS);
  const reviewerEmails = parseAllowlist(env.JOBREADY_ADMIN_REVIEWER_EMAILS);
  const reviewerUserIds = parseAllowlist(env.JOBREADY_ADMIN_REVIEWER_USER_IDS);
  const jobEditorEmails = parseAllowlist(env.JOBREADY_ADMIN_JOB_EDITOR_EMAILS);
  const jobEditorUserIds = parseAllowlist(env.JOBREADY_ADMIN_JOB_EDITOR_USER_IDS);
  const analystEmails = parseAllowlist(env.JOBREADY_ADMIN_ANALYST_EMAILS);
  const analystUserIds = parseAllowlist(env.JOBREADY_ADMIN_ANALYST_USER_IDS);
  const legacyAdminEmails = parseAllowlist(env.JOBREADY_ADMIN_EMAILS);
  const legacyAdminUserIds = parseAllowlist(env.JOBREADY_ADMIN_USER_IDS);

  if ((email && ownerEmails.has(email)) || ownerUserIds.has(userId)) {
    addRole(roles, "owner");
  }
  if ((email && editorEmails.has(email)) || editorUserIds.has(userId)) {
    addRole(roles, "editor");
  }
  if ((email && reviewerEmails.has(email)) || reviewerUserIds.has(userId)) {
    addRole(roles, "reviewer");
  }
  if ((email && jobEditorEmails.has(email)) || jobEditorUserIds.has(userId)) {
    addRole(roles, "job_editor");
  }
  if ((email && analystEmails.has(email)) || analystUserIds.has(userId)) {
    addRole(roles, "analyst");
  }
  if ((email && legacyAdminEmails.has(email)) || legacyAdminUserIds.has(userId)) {
    addRole(roles, "editor");
  }

  if (roles.size === 0) return null;

  return {
    userId: user.id,
    email,
    roles: Array.from(roles),
  };
}

export function hasAdminPermission(
  actor: AdminActor | null,
  permission: AdminPermission,
) {
  if (!actor) return false;

  return actor.roles.some((role) =>
    PERMISSIONS_BY_ROLE[role].includes(permission),
  );
}

export function assertAdminPermission(
  actor: AdminActor | null,
  permission: AdminPermission,
): asserts actor is AdminActor {
  if (!actor) {
    throw new AdminAuthorizationError(
      "unauthorized",
      "Sign in with an authorized Jiandae admin account.",
    );
  }

  if (!hasAdminPermission(actor, permission)) {
    throw new AdminAuthorizationError(
      "forbidden",
      "This admin role does not have permission for that operation.",
      { permission, roles: actor.roles },
    );
  }
}

export async function getCurrentAdminActor() {
  return adminActorFromUser(await getCurrentUser());
}

export async function requireCurrentAdminActor(permission: AdminPermission) {
  const actor = await getCurrentAdminActor();
  assertAdminPermission(actor, permission);
  return actor;
}

export function adminRoleLabel(role: AdminRole) {
  if (role === "job_editor") return "Job editor";
  return role.charAt(0).toUpperCase() + role.slice(1);
}
