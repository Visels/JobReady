"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  emptyCvDraft,
  cvEvidence,
  CV_DOCUMENT_SAVED_EVENT,
  type CvSavedDocumentDetail,
  type CvDocumentOption,
  type CvDraft,
  type SavedCvDraft,
} from "@/lib/cv/contracts";

type SaveStatus =
  "loading" | "saved" | "unsaved" | "saving" | "error" | "conflict";

function rememberDocument(id: string | null) {
  if (window.location.pathname !== "/cv-resume") return;
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("document", id);
  else url.searchParams.delete("document");
  window.history.replaceState(window.history.state, "", url);
}
export async function cvRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(data.error || "The request failed. Please try again."),
      { status: response.status },
    );
  return data as T;
}

export function useCvDraft(
  initialDocuments: CvDocumentOption[],
  initialDocumentId?: string,
) {
  const [draft, setDraft] = useState<CvDraft>(emptyCvDraft);
  const [documentId, setDocumentId] = useState("");
  const [documents, setDocuments] = useState(initialDocuments);
  const [status, setStatus] = useState<SaveStatus>(
    initialDocumentId ? "loading" : "saved",
  );
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(!initialDocumentId);
  const current = useRef({
    draft,
    documentId: "",
    versionId: null as string | null,
    savedText: JSON.stringify(draft),
    ready: !initialDocumentId,
    conflict: false,
  });
  const saving = useRef<Promise<boolean> | null>(null);
  const loading = useRef(0);

  const install = useCallback(
    (id: string, next: CvDraft, versionId: string | null) => {
      current.current = {
        draft: next,
        documentId: id,
        versionId,
        savedText: JSON.stringify(next),
        ready: true,
        conflict: false,
      };
      setDraft(next);
      setDocumentId(id);
      setReady(true);
      setStatus("saved");
      setError(null);
      rememberDocument(versionId ? id : null);
    },
    [],
  );

  const update = useCallback((next: CvDraft) => {
    if (!current.current.documentId) {
      current.current.documentId = crypto.randomUUID();
      setDocumentId(current.current.documentId);
    }
    current.current.draft = next;
    setDraft(next);
    setStatus(
      current.current.conflict
        ? "conflict"
        : JSON.stringify(next) === current.current.savedText
          ? "saved"
          : "unsaved",
    );
  }, []);

  const saveNow = useCallback((): Promise<boolean> => {
    if (saving.current) return saving.current;
    const run = async () => {
      if (!current.current.ready || current.current.conflict) return false;
      while (
        JSON.stringify(current.current.draft) !== current.current.savedText
      ) {
        const { documentId, versionId, draft } = current.current;
        const text = JSON.stringify(draft);
        setStatus("saving");
        try {
          const result = await cvRequest<SavedCvDraft>("/api/cv/drafts", {
            method: "POST",
            body: JSON.stringify({
              documentId,
              expectedVersionId: versionId,
              draft,
            }),
          });
          current.current.versionId = result.versionId;
          current.current.savedText = text;
          rememberDocument(documentId);
          setDocuments((options) => [
            { id: documentId, title: draft.title.trim() || "Untitled CV" },
            ...options.filter((option) => option.id !== documentId),
          ]);
          setError(null);
          window.dispatchEvent(
            new CustomEvent<CvSavedDocumentDetail>(CV_DOCUMENT_SAVED_EVENT, {
              detail: {
                id: documentId,
                title: draft.title.trim() || "Untitled CV",
                kind: draft.kind,
                currentVersionId: result.versionId,
                currentVersionNumber: null,
                factCount: cvEvidence(draft).filter((field) =>
                  field.text.trim(),
                ).length,
              },
            }),
          );
        } catch (error) {
          const conflict =
            error instanceof Error && "status" in error && error.status === 409;
          current.current.conflict = conflict;
          setStatus(conflict ? "conflict" : "error");
          setError(
            error instanceof Error
              ? error.message
              : "Couldn't save your CV. Please try again.",
          );
          return false;
        }
      }
      setStatus("saved");
      return true;
    };
    const promise = run().finally(() => {
      saving.current = null;
    });
    saving.current = promise;
    return promise;
  }, []);

  const open = useCallback(
    async (id: string, discard = false) => {
      if (!discard && current.current.ready && !(await saveNow())) return;
      const token = ++loading.current;
      setStatus("loading");
      setReady(false);
      current.current.ready = false;
      try {
        const result = await cvRequest<SavedCvDraft>(
          `/api/cv/drafts?id=${encodeURIComponent(id)}`,
        );
        if (token === loading.current)
          install(id, result.draft, result.versionId);
      } catch (error) {
        if (token !== loading.current) return;
        setError(
          error instanceof Error ? error.message : "Couldn't open this CV.",
        );
        setStatus("error");
        // Preserve any draft already in the editor if opening another CV fails.
        if (current.current.documentId) {
          current.current.ready = true;
          setReady(true);
        }
      }
    },
    [install, saveNow],
  );

  useEffect(() => {
    if (!initialDocumentId) return;
    let active = true;
    void cvRequest<SavedCvDraft>(
      `/api/cv/drafts?id=${encodeURIComponent(initialDocumentId)}`,
    )
      .then((result) => {
        if (active) install(initialDocumentId, result.draft, result.versionId);
      })
      .catch((error) => {
        if (active) {
          setStatus("error");
          setError(
            error instanceof Error ? error.message : "Couldn't open this CV.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [initialDocumentId, install]);

  useEffect(() => {
    if (
      !ready ||
      current.current.conflict ||
      JSON.stringify(draft) === current.current.savedText
    )
      return;
    const timer = setTimeout(() => {
      void saveNow();
    }, 1_200);
    return () => clearTimeout(timer);
  }, [draft, ready, saveNow]);

  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(current.current.draft) !== current.current.savedText) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, []);

  const create = async () => {
    if (!current.current.ready || (await saveNow()))
      install(crypto.randomUUID(), emptyCvDraft(), null);
  };
  const saveCopy = async () => {
    if (saving.current) await saving.current;
    const next = {
      ...current.current.draft,
      title: `${current.current.draft.title.slice(0, 110)} (copy)`,
    };
    install(crypto.randomUUID(), next, null);
    current.current.savedText = "";
    await saveNow();
  };
  return {
    draft,
    documentId,
    documents,
    status,
    error,
    ready,
    update,
    saveNow,
    open,
    create,
    saveCopy,
    getDraft: () => current.current.draft,
  };
}
