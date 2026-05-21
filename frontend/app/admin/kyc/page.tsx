"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import {
  AdminShell,
  PanelHeader,
  StatusPill,
  isImageReference,
  parseKycNotes,
  type KycSubmission,
  useAdminRealtime
} from "@/components/qiilu/admin-ops";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api";

export default function AdminKycPage() {
  const loadKyc = useCallback(
    () => fetchJson<{ submissions: KycSubmission[] }>("/admin/kyc"),
    []
  );
  const { data, setData, message, setMessage } = useAdminRealtime(loadKyc, { submissions: [] });
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const reviewKyc = async (submissionId: string, status: "APPROVED" | "REJECTED") => {
    await fetchJson(`/admin/kyc/${submissionId}/review`, {
      method: "POST",
      body: JSON.stringify({ status, notes: reviewNotes[submissionId]?.trim() || undefined })
    });

    const next = await loadKyc();
    setData(next);
    setReviewNotes((current) => {
      const copy = { ...current };
      delete copy[submissionId];
      return copy;
    });
    setMessage(`KYC ${status.toLowerCase()} successfully.`);
  };

  const pending = data.submissions.filter((item) => item.status === "PENDING").length;
  const approved = data.submissions.filter((item) => item.status === "APPROVED").length;

  return (
    <AdminShell
      title="KYC Review Desk"
      subtitle="Work through identity verification with a cleaner manual review surface for documents, selfies, and reviewer notes."
      metrics={[
        { label: "Pending", value: `${pending}` },
        { label: "Approved", value: `${approved}` },
        { label: "Total queue", value: `${data.submissions.length}` },
        { label: "Sync status", value: message }
      ]}
      rail={
        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(34,197,94,0.10))] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FileCheck2 className="h-4 w-4 text-primary" />
            Verification focus
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>Use this page when you want identity review without the noise of dispatch, payouts, or safety work.</div>
            <div className="font-semibold text-foreground">{message}</div>
          </div>
        </div>
      }
    >
      <section className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
        <PanelHeader title="KYC review queue" meta="Approve or reject submissions with full document and selfie context" />
        <div className="grid gap-3">
          {data.submissions.length ? data.submissions.map((submission) => {
            const details = parseKycNotes(submission.notes);

            return (
              <div key={submission.id} className="rounded-[1.3rem] border border-border/80 bg-card/88 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold">{submission.user.name}</div>
                      <div className="text-sm text-muted-foreground">{submission.user.phone} | {submission.user.role}</div>
                    </div>
                  </div>
                  <StatusPill
                    label={submission.status}
                    tone={
                      submission.status === "APPROVED"
                        ? "success"
                        : submission.status === "REJECTED"
                          ? "danger"
                          : "warning"
                    }
                  />
                </div>
                <div className="mb-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <div>Document: {details?.documentType ?? "Not specified"}</div>
                  <div>Number: {details?.documentNumber ?? "Not specified"}</div>
                  <div>Name: {details?.legalName ?? "Not specified"}</div>
                  <div>Country: {details?.issuingCountry ?? "Not specified"}</div>
                </div>
                <div className="mb-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border/80 bg-muted/30 p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Front preview</div>
                    {isImageReference(submission.documentUrl) ? (
                      <img src={submission.documentUrl} alt={`${submission.user.name} KYC document front`} className="h-36 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-36 items-center justify-center rounded-xl bg-background text-sm text-muted-foreground">
                        Preview unavailable for this file type
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-muted/30 p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Back preview</div>
                    {isImageReference(details?.documentBackUrl) ? (
                      <img src={details?.documentBackUrl ?? undefined} alt={`${submission.user.name} KYC document back`} className="h-36 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-36 items-center justify-center rounded-xl bg-background text-sm text-muted-foreground">
                        {details?.documentBackUrl ? "Preview unavailable for this file type" : "Back side missing"}
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-muted/30 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selfie check</div>
                      <span className="text-xs font-semibold text-muted-foreground">{details?.selfieProvided ? "Provided" : "Missing"}</span>
                    </div>
                    {details?.selfieImageUrl ? (
                      <img src={details.selfieImageUrl} alt={`${submission.user.name} selfie verification`} className="h-36 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-36 items-center justify-center rounded-xl bg-background text-sm text-muted-foreground">
                        No selfie captured yet
                      </div>
                    )}
                  </div>
                </div>
                {details?.notes ? <p className="mb-4 text-sm text-muted-foreground">{details.notes}</p> : null}
                <div className="mb-4 rounded-2xl border border-border/80 bg-muted/30 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selfie comparison note</div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {[
                      "Selfie matches document",
                      "Selfie does not match document",
                      "Selfie unclear, needs manual follow-up"
                    ].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          reviewNotes[submission.id] === option
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground"
                        }`}
                        onClick={() =>
                          setReviewNotes((current) => ({
                            ...current,
                            [submission.id]: option
                          }))
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewNotes[submission.id] ?? ""}
                    onChange={(event) =>
                      setReviewNotes((current) => ({
                        ...current,
                        [submission.id]: event.target.value
                      }))
                    }
                    placeholder="Add any extra review context for this submission"
                    className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={submission.documentUrl} target="_blank">
                    <Button variant="outline" className="h-9 w-auto flex-none rounded-full px-3 text-xs">Open front</Button>
                  </Link>
                  {details?.documentBackUrl ? (
                    <Link href={details.documentBackUrl} target="_blank">
                      <Button variant="outline" className="h-9 w-auto flex-none rounded-full px-3 text-xs">Open back</Button>
                    </Link>
                  ) : null}
                  {details?.selfieImageUrl ? (
                    <Link href={details.selfieImageUrl} target="_blank">
                      <Button variant="outline" className="h-9 w-auto flex-none rounded-full px-3 text-xs">Open selfie</Button>
                    </Link>
                  ) : null}
                  <Button variant="outline" className="h-9 w-auto flex-none rounded-full px-4 text-xs" onClick={() => reviewKyc(submission.id, "REJECTED")}>
                    Reject
                  </Button>
                  <Button className="h-9 w-auto flex-none rounded-full px-4 text-xs" onClick={() => reviewKyc(submission.id, "APPROVED")}>
                    Approve
                  </Button>
                </div>
              </div>
            );
          }) : <div className="rounded-[1.3rem] border border-dashed border-border p-6 text-center text-muted-foreground">No KYC submissions waiting.</div>}
        </div>
      </section>
    </AdminShell>
  );
}
