import {
  aiRevisionSchema,
  applyCvRevision,
  cvEvidence,
  cvTextFields,
  type CvDraft,
} from "./contracts";

export function validateCvRevision(
  draft: CvDraft,
  value: unknown,
  scope: string,
) {
  const revision = aiRevisionSchema.parse(value);
  const evidence = new Map(
    cvEvidence(draft).map((field) => [field.id, field.text]),
  );
  const fields = new Map(cvTextFields(draft).map((field) => [field.id, field]));
  if (scope !== "all" && !fields.has(scope))
    throw new Error("Choose an existing section to revise.");
  for (const change of revision.changes) {
    if (
      !fields.has(change.fieldId) ||
      (scope !== "all" && change.fieldId !== scope)
    )
      throw new Error(
        "The suggestion changed a section outside your request. Please try again.",
      );
    const sources = change.sourceFieldIds
      .map((id) => {
        if (!evidence.has(id))
          throw new Error(
            "The suggestion could not be traced to your CV. Please try again.",
          );
        return evidence.get(id)!;
      })
      .join("\n");
    const numbers = new Set(sources.match(/\d+(?:[.,]\d+)*%?/g) ?? []);
    if (
      (change.after.match(/\d+(?:[.,]\d+)*%?/g) ?? []).some(
        (number) => !numbers.has(number),
      )
    )
      throw new Error(
        "The suggestion introduced an unsupported number. Please try again.",
      );
    if (change.after.includes("[redacted-"))
      throw new Error(
        "The suggestion included redacted details. Please edit this section manually.",
      );
  }
  applyCvRevision(draft, revision);
  return revision;
}
