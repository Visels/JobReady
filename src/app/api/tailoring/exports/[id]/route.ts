import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session-guards";
import { CloudflareR2ObjectStorage } from "@/lib/storage/r2-storage";
import { buildR2StorageConfig } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function extensionForFormat(format: string) {
  return format === "pdf" ? "pdf" : "docx";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await context.params;
  const exportRecord = await prisma.tailoringExport.findFirst({
    where: {
      id,
      userId: user.id,
      deletedAt: null,
    },
    include: {
      tailoringRun: {
        include: {
          jobPostingVersion: {
            include: {
              posting: { include: { company: true } },
            },
          },
          privateJobTargetVersion: true,
          outputDocumentVersion: {
            include: { document: true },
          },
        },
      },
    },
  });

  if (!exportRecord) {
    return Response.json({ error: "Export not found." }, { status: 404 });
  }

  const config = buildR2StorageConfig();
  const storage = new CloudflareR2ObjectStorage(config);
  const object = await storage.getObject({
    bucket: exportRecord.r2Bucket,
    key: exportRecord.r2Key,
  });
  const targetTitle =
    exportRecord.tailoringRun.jobPostingVersion?.title ??
    exportRecord.tailoringRun.privateJobTargetVersion?.roleTitle ??
    exportRecord.tailoringRun.roleTitle ??
    "tailored-cv";
  const companyName =
    exportRecord.tailoringRun.jobPostingVersion?.posting.company.displayName ??
    exportRecord.tailoringRun.privateJobTargetVersion?.companyName ??
    exportRecord.tailoringRun.companyName;
  const baseName = safeFilename(
    [targetTitle, companyName, "tailored"].filter(Boolean).join(" "),
  );
  const extension = extensionForFormat(exportRecord.format);

  return new Response(Buffer.from(object.body), {
    headers: {
      "Content-Type": exportRecord.mimeType,
      "Content-Disposition": `attachment; filename="${baseName}.${extension}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
