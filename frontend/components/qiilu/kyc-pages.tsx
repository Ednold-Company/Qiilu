"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ChevronLeft, FileText, ShieldCheck, UploadCloud, User, CreditCard, Car } from "lucide-react";
import { DriverDesktopShell } from "@/components/qiilu/driver-desktop-routes";
import { DriverShell } from "@/components/qiilu/driver-mobile-routes";
import { PassengerDesktopShell } from "@/components/qiilu/passenger-desktop-routes";
import { MobileShell } from "@/components/qiilu/passenger-mobile-routes";
import { fetchJson } from "@/lib/api";
import type { SessionUser } from "@/lib/auth-session";
import { readDocumentFileAsDataUrl } from "@/lib/document-upload";

type DriverKycResponse = {
  kycStatus: "PENDING" | "APPROVED" | "REJECTED";
  latestSubmission: { status: "PENDING" | "APPROVED" | "REJECTED"; documentType: string | null; documentNumber: string | null; legalName: string | null; documentUrl: string; reviewerNotes: string | null; createdAt: string } | null;
  submissions: Array<{ id: string; status: "PENDING" | "APPROVED" | "REJECTED"; documentType: string | null; documentNumber: string | null; documentUrl: string; reviewerNotes: string | null; createdAt: string }>;
  requiredDocuments: string[];
};

type PassengerKycResponse = {
  kycStatus: "PENDING" | "APPROVED" | "REJECTED";
  latestSubmission: { status: "PENDING" | "APPROVED" | "REJECTED"; documentType: string | null; documentNumber: string | null; legalName: string | null; documentUrl: string; selfieProvided: boolean; selfieImageUrl: string | null; reviewerNotes: string | null; createdAt: string } | null;
  submissions: Array<{ id: string; status: "PENDING" | "APPROVED" | "REJECTED"; documentType: string | null; documentNumber: string | null; documentUrl: string; selfieProvided: boolean; selfieImageUrl: string | null; reviewerNotes: string | null; createdAt: string }>;
  requiredDocuments: string[];
};

function statusTone(status: "PENDING" | "APPROVED" | "REJECTED") {
  if (status === "APPROVED") return "bg-secondary/10 text-secondary";
  if (status === "REJECTED") return "bg-destructive/10 text-destructive";
  return "bg-primary/10 text-primary";
}

function Field({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm outline-none" />
    </label>
  );
}

function UploadField({
  label,
  helper,
  fileName,
  onSelect,
  disabled
}: {
  label: string;
  helper: string;
  fileName: string | null;
  onSelect: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="block">
      <div className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold">{fileName ?? "No file selected yet"}</div>
            <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Choose file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onSelect(file);
              }
              event.currentTarget.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}

function KycReviewerFeedback({
  status,
  reviewerNotes
}: {
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewerNotes?: string | null;
}) {
  if (!reviewerNotes?.trim()) {
    return null;
  }

  return (
    <div className={`rounded-xl px-4 py-3 text-sm ${status === "REJECTED" ? "bg-destructive/10 text-destructive" : "bg-muted/60 text-muted-foreground"}`}>
      <div className="mb-1 text-xs font-bold uppercase tracking-wider">
        {status === "REJECTED" ? "What to fix" : "Reviewer note"}
      </div>
      <div>{reviewerNotes}</div>
    </div>
  );
}

function DriverKycContent({ user, compact }: { user: SessionUser; compact: boolean }) {
  const [payload, setPayload] = useState<DriverKycResponse | null>(null);
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState("DRIVERS_LICENSE");
  const [documentNumber, setDocumentNumber] = useState("");
  const [legalName, setLegalName] = useState(user.name);
  const [issuingCountry, setIssuingCountry] = useState("Ghana");
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentFileName, setDocumentFileName] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => setPayload(await fetchJson<DriverKycResponse>(`/driver/kyc/${user.id}`));

  useEffect(() => {
    load().catch(() => setPayload(null));
  }, [user.id]);

  const handleDocumentSelect = async (file: File) => {
    try {
      const dataUrl = await readDocumentFileAsDataUrl(file);
      setDocumentUrl(dataUrl);
      setDocumentFileName(file.name);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not read the selected document.");
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      await fetchJson(`/driver/kyc/${user.id}`, {
        method: "POST",
        body: JSON.stringify({ documentType, documentNumber, legalName, issuingCountry, documentUrl })
      });
      await load();
      setStep(4);
      setMessage("Application submitted for review.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit KYC.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-extrabold">{compact ? "Driver KYC" : "KYC / Documents"}</div>
            <div className="text-sm text-muted-foreground">Upload your identity and vehicle documents to stay active.</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusTone(payload?.kycStatus ?? "PENDING")}`}>{payload?.kycStatus ?? "PENDING"}</span>
        </div>
        <div className="mb-6 flex gap-1">
          {[1, 2, 3, 4].map((item) => <div key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-primary" : "bg-muted"}`} />)}
        </div>
        {step === 1 ? (
          <div>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              {[{ icon: User, title: "Personal ID" }, { icon: CreditCard, title: "Driver's Licence" }, { icon: Car, title: "Vehicle Docs" }].map((item) => (
                <div key={item.title} className="rounded-2xl bg-muted/50 p-5">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><item.icon className="h-6 w-6 text-primary" /></div>
                  <div className="font-bold">{item.title}</div>
                </div>
              ))}
            </div>
            <button type="button" className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground" onClick={() => setStep(2)}>Start Verification</button>
          </div>
        ) : null}
        {step === 2 ? (
          <div>
            <div className="mb-6 flex flex-wrap gap-3">
              {(payload?.requiredDocuments ?? ["DRIVERS_LICENSE", "GHANA_CARD"]).map((item) => (
                <button key={item} type="button" onClick={() => setDocumentType(item)} className={`rounded-full border-2 px-4 py-2 text-sm font-bold ${documentType === item ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground"}`}>{item.replaceAll("_", " ")}</button>
              ))}
            </div>
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              {["Front of ID", "Back of ID"].map((label) => (
                <div key={label} className="aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center">
                  <UploadCloud className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                  <div className="font-bold text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button type="button" className="flex items-center text-muted-foreground" onClick={() => setStep(1)}><ChevronLeft className="mr-2 h-4 w-4" /> Back</button>
              <button type="button" className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground" onClick={() => setStep(3)}>Continue</button>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="space-y-4">
            <Field label="Document Number" value={documentNumber} onChange={setDocumentNumber} placeholder="GHA-DL-XXXXXXXX" />
            <Field label="Legal Name" value={legalName} onChange={setLegalName} placeholder="Name on document" />
            <Field label="Issuing Country" value={issuingCountry} onChange={setIssuingCountry} placeholder="Ghana" />
            <UploadField
              label="Uploaded Document"
              helper="Upload a PNG, JPG, WebP image, or PDF up to 5MB."
              fileName={documentFileName}
              onSelect={(file) => void handleDocumentSelect(file)}
              disabled={submitting}
            />
            <label className="flex items-start gap-3 rounded-xl bg-muted/30 p-4"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-5 w-5 rounded" /><span className="text-sm text-muted-foreground">I confirm these documents belong to me and the information is accurate.</span></label>
            {message ? <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{message}</div> : null}
            <div className="flex items-center justify-between">
              <button type="button" className="flex items-center text-muted-foreground" onClick={() => setStep(2)}><ChevronLeft className="mr-2 h-4 w-4" /> Back</button>
              <button type="button" disabled={!consent || !documentNumber || !documentUrl || submitting} onClick={() => void submit()} className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground disabled:opacity-60">{submitting ? "Submitting..." : "Submit Application"}</button>
            </div>
          </div>
        ) : null}
        {step === 4 ? (
          <div>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20"><CheckCircle2 className="h-10 w-10 text-secondary" /></div>
            <div className="mb-2 text-2xl font-extrabold">KYC review in progress</div>
            <div className="mb-6 text-sm text-muted-foreground">Latest submission: {payload?.latestSubmission?.documentType?.replaceAll("_", " ") ?? "No document submitted yet"}</div>
            {payload?.latestSubmission ? <div className="mb-4"><KycReviewerFeedback status={payload.latestSubmission.status} reviewerNotes={payload.latestSubmission.reviewerNotes} /></div> : null}
            <div className="space-y-3">
              {(payload?.submissions ?? []).length ? payload!.submissions.map((submission) => (
                <div key={submission.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-bold">{submission.documentType?.replaceAll("_", " ") ?? "Document"}</div>
                    <div className="text-xs text-muted-foreground">{submission.documentNumber ?? "No number"} • {new Date(submission.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusTone(submission.status)}`}>{submission.status}</span>
                    <a href={submission.documentUrl} target="_blank" rel="noreferrer" className="mt-2 block text-xs font-bold text-primary">Open document</a>
                  </div>
                  {submission.reviewerNotes ? <div className="mt-3"><KycReviewerFeedback status={submission.status} reviewerNotes={submission.reviewerNotes} /></div> : null}
                </div>
              )) : <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No KYC submissions yet.</div>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PassengerKycContent({ user, compact }: { user: SessionUser; compact: boolean }) {
  const [payload, setPayload] = useState<PassengerKycResponse | null>(null);
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState("GHANA_CARD");
  const [documentNumber, setDocumentNumber] = useState("");
  const [legalName, setLegalName] = useState(user.name);
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentFileName, setDocumentFileName] = useState<string | null>(null);
  const [selfieProvided, setSelfieProvided] = useState(false);
  const [selfieImageUrl, setSelfieImageUrl] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const load = async () => setPayload(await fetchJson<PassengerKycResponse>(`/passenger/kyc/${user.id}`));

  useEffect(() => {
    load().catch(() => setPayload(null));
  }, [user.id]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopCapture = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCapturing(false);
  };

  const handleDocumentSelect = async (file: File) => {
    try {
      const dataUrl = await readDocumentFileAsDataUrl(file);
      setDocumentUrl(dataUrl);
      setDocumentFileName(file.name);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not read the selected document.");
    }
  };

  const startCapture = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported on this device.");
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCapturing(true);
      setSelfieProvided(false);
      setSelfieImageUrl("");
      setMessage(null);
    } catch (error) {
      setCapturing(false);
      setMessage(error instanceof Error ? error.message : "We could not access your camera.");
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setMessage("Camera is not ready yet. Please try again.");
      return;
    }

    const width = video.videoWidth || 720;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      setMessage("We could not capture your selfie. Please try again.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setSelfieImageUrl(dataUrl);
    setSelfieProvided(true);
    stopCapture();
  };

  const retakeSelfie = () => {
    setSelfieProvided(false);
    setSelfieImageUrl("");
    void startCapture();
  };

  const submit = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      await fetchJson(`/passenger/kyc/${user.id}`, {
        method: "POST",
        body: JSON.stringify({ documentType, documentNumber, legalName, documentUrl, selfieProvided, selfieImageUrl })
      });
      await load();
      setStep(4);
      setMessage("Verification submitted for review.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit verification.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-extrabold">{compact ? "Identity Verification" : "Passenger Verification"}</div>
            <div className="text-sm text-muted-foreground">A one-time check to keep everyone safer on Qiilu.</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusTone(payload?.kycStatus ?? "PENDING")}`}>{payload?.kycStatus ?? "PENDING"}</span>
        </div>
        <div className="mb-6 flex gap-1">
          {[1, 2, 3, 4].map((item) => <div key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-primary" : "bg-muted"}`} />)}
        </div>
        {step === 1 ? (
          <div>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              {["Faster bookings", "Access premium rides", "Dispute protection"].map((title) => (
                <div key={title} className="rounded-2xl bg-muted/50 p-5">
                  <div className="font-bold">{title}</div>
                </div>
              ))}
            </div>
            <button type="button" className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground" onClick={() => setStep(2)}>Get Started</button>
          </div>
        ) : null}
        {step === 2 ? (
          <div>
            <div className="mb-6 flex flex-wrap gap-3">
              {(payload?.requiredDocuments ?? ["GHANA_CARD", "PASSPORT"]).map((item) => (
                <button key={item} type="button" onClick={() => setDocumentType(item)} className={`rounded-full border-2 px-4 py-2 text-sm font-bold ${documentType === item ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground"}`}>{item.replaceAll("_", " ")}</button>
              ))}
            </div>
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              {["Front of ID", "Back of ID"].map((label) => (
                <div key={label} className="aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center">
                  <UploadCloud className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                  <div className="font-bold text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button type="button" className="flex items-center text-muted-foreground" onClick={() => setStep(1)}><ChevronLeft className="mr-2 h-4 w-4" /> Back</button>
              <button type="button" className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground" onClick={() => setStep(3)}>Continue</button>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="text-center">
            <div className="relative mx-auto mb-6 h-56 w-56 overflow-hidden rounded-full border-4 border-muted bg-muted/30">
              {capturing ? (
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              ) : selfieImageUrl ? (
                <img src={selfieImageUrl} alt="Captured selfie preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="mb-2 text-lg font-medium">
              {selfieProvided ? "Selfie captured successfully!" : capturing ? "Align your face within the circle and capture your selfie." : "We need a live selfie to verify this account."}
            </div>
            <div className="mb-6 text-sm text-muted-foreground">
              Use the front camera in a well-lit area so your face is clearly visible.
            </div>
            {message ? <div className="mb-6 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{message}</div> : null}
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="flex items-center text-muted-foreground"
                onClick={() => {
                  stopCapture();
                  setStep(2);
                }}
              ><ChevronLeft className="mr-2 h-4 w-4" /> Back</button>
              {!capturing && !selfieProvided ? (
                <button type="button" className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground" onClick={() => void startCapture()}>
                  Enable Camera
                </button>
              ) : null}
              {capturing ? (
                <button type="button" className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground" onClick={captureSelfie}>
                  Capture Selfie
                </button>
              ) : null}
              {selfieProvided ? (
                <div className="flex gap-3">
                  <button type="button" className="rounded-xl border border-border px-6 py-3 font-bold text-foreground" onClick={retakeSelfie}>
                    Retake
                  </button>
                  <button type="button" className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground" onClick={() => setStep(4)}>
                    Looks Good
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {step === 4 ? (
          <div>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20"><CheckCircle2 className="h-10 w-10 text-secondary" /></div>
            <div className="mb-4 text-2xl font-extrabold">Review Submission</div>
            {payload?.latestSubmission ? <div className="mb-4"><KycReviewerFeedback status={payload.latestSubmission.status} reviewerNotes={payload.latestSubmission.reviewerNotes} /></div> : null}
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <Field label="Full Name" value={legalName} onChange={setLegalName} placeholder="Full name" />
              <Field label="Document Number" value={documentNumber} onChange={setDocumentNumber} placeholder="GHA-XXXXXXXXX-X" />
              <UploadField
                label="Uploaded Document"
                helper="Upload a PNG, JPG, WebP image, or PDF up to 5MB."
                fileName={documentFileName}
                onSelect={(file) => void handleDocumentSelect(file)}
                disabled={submitting}
              />
              <div className="rounded-xl bg-muted/30 p-4">
                <div className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Selfie Check</div>
                <div className="text-sm font-medium">{selfieProvided ? "Completed" : "Missing"}</div>
                {selfieImageUrl ? <img src={selfieImageUrl} alt="Selfie review preview" className="mt-3 h-20 w-20 rounded-2xl object-cover" /> : null}
              </div>
            </div>
            <label className="mb-6 flex items-start gap-3 rounded-xl bg-muted/30 p-4"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-5 w-5 rounded" /><span className="text-sm text-muted-foreground">I confirm these documents belong to me and the information is accurate.</span></label>
            {message ? <div className="mb-6 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{message}</div> : null}
            <div className="flex items-center justify-between">
              <button type="button" className="flex items-center text-muted-foreground" onClick={() => setStep(3)}><ChevronLeft className="mr-2 h-4 w-4" /> Back</button>
              <button type="button" disabled={!consent || !documentNumber || !documentUrl || !selfieProvided || submitting} onClick={() => void submit()} className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground disabled:opacity-60">{submitting ? "Submitting..." : "Submit for Verification"}</button>
            </div>
            {(payload?.submissions ?? []).length ? <div className="mt-6 space-y-3">{payload!.submissions.map((submission) => <div key={submission.id} className="flex items-center justify-between rounded-xl border border-border p-4"><div><div className="font-bold">{submission.documentType?.replaceAll("_", " ") ?? "Document"}</div><div className="text-xs text-muted-foreground">{submission.documentNumber ?? "No number"} • {new Date(submission.createdAt).toLocaleString()}</div></div><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusTone(submission.status)}`}>{submission.status}</span></div>)}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DriverKycMobilePage({ user }: { user: SessionUser }) { return <DriverShell title="Driver KYC" active="account"><DriverKycContent user={user} compact /></DriverShell>; }
export function DriverKycDesktopPage({ user }: { user: SessionUser }) { return <DriverDesktopShell user={user} title="KYC / Documents" active="account"><DriverKycContent user={user} compact={false} /></DriverDesktopShell>; }
export function PassengerKycMobilePage({ user }: { user: SessionUser }) { return <MobileShell title="Identity Verification" active="account"><PassengerKycContent user={user} compact /></MobileShell>; }
export function PassengerKycDesktopPage({ user }: { user: SessionUser }) { return <PassengerDesktopShell user={user} title="Passenger Verification" active="account"><PassengerKycContent user={user} compact={false} /></PassengerDesktopShell>; }
