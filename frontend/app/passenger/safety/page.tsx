"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, ShieldCheck, ShieldPlus } from "lucide-react";
import { PassengerGuard, PassengerSectionShell } from "@/components/qiilu/passenger-shell";
import { MobileShell } from "@/components/qiilu/passenger-mobile-routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/api";
import type { SessionUser } from "@/lib/auth-session";

type PassengerExperience = {
  preferredPayment: "MOMO" | "CASH";
  momoProvider: string | null;
  trustedContacts: string[];
  lowBandwidthMode: boolean;
  safetyShareEnabled: boolean;
};

type IncidentItem = {
  id: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  createdAt: string;
};

function PassengerSafetyContent() {
  const [experience, setExperience] = useState<PassengerExperience | null>(null);
  const [trustedContacts, setTrustedContacts] = useState("");
  const [safetyShareEnabled, setSafetyShareEnabled] = useState(true);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchJson<{ experience: PassengerExperience }>("/passenger/experience"),
      fetchJson<{ incidents: IncidentItem[] }>("/support/incidents")
    ])
      .then(([experiencePayload, incidentsPayload]) => {
        setExperience(experiencePayload.experience);
        setTrustedContacts(experiencePayload.experience.trustedContacts.join(", "));
        setSafetyShareEnabled(experiencePayload.experience.safetyShareEnabled);
        setIncidents(incidentsPayload.incidents);
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load your safety settings.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const save = async () => {
    if (!experience) {
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const payload = await fetchJson<{ message: string; experience: PassengerExperience }>(
        "/passenger/experience",
        {
          method: "PUT",
          body: JSON.stringify({
            ...experience,
            trustedContacts: trustedContacts
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            safetyShareEnabled
          })
        }
      );
      setExperience(payload.experience);
      setStatus(payload.message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save your safety settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center rounded-3xl border border-border bg-card">
        <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldPlus className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Trusted contacts</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Add the people who should receive trip updates when safety sharing is enabled.
            </p>
          </div>
        </div>

        <Input
          value={trustedContacts}
          onChange={(event) => setTrustedContacts(event.target.value)}
          placeholder="Comma-separated phone numbers or names"
          className="mb-4 h-12 border-transparent bg-muted/40 dark:bg-white/5"
        />

        <button
          type="button"
          className={`mb-4 w-full rounded-2xl border px-4 py-4 text-left text-sm font-semibold ${
            safetyShareEnabled ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30"
          }`}
          onClick={() => setSafetyShareEnabled((current) => !current)}
        >
          {safetyShareEnabled ? "Safety sharing is enabled" : "Safety sharing is disabled"}
        </button>

        {status ? (
          <div className="mb-4 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground dark:bg-white/5">
            {status}
          </div>
        ) : null}

        <Button className="rounded-xl" disabled={isSaving} onClick={save}>
          {isSaving ? "Saving..." : "Save safety settings"}
        </Button>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Status</h2>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          {safetyShareEnabled
            ? "Trip updates will be shared automatically with your trusted contacts."
            : "Qiilu will only notify your contacts when you turn sharing back on."}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Recent reports</h2>
        <div className="mt-4 grid gap-3">
          {incidents.length ? (
            incidents.slice(0, 3).map((incident) => (
              <div key={incident.id} className="rounded-2xl bg-muted/40 p-4 text-sm dark:bg-white/5">
                <div className="font-semibold">{incident.category}</div>
                <div className="mt-1 text-muted-foreground">
                  {incident.status} • {incident.severity}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground dark:bg-white/5">
              No safety incidents reported yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function PassengerSafetyPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <>
          <div className="hidden lg:block">
            <PassengerSafetyDesktop user={user} />
          </div>
          <div className="lg:hidden">
            <MobileShell title="Safety" active="account">
              <PassengerSafetyContent />
            </MobileShell>
          </div>
        </>
      )}
    </PassengerGuard>
  );
}

function PassengerSafetyDesktop({ user }: { user: SessionUser }) {
  return (
    <PassengerSectionShell
      user={user}
      title="Safety"
      subtitle="Manage trusted contacts and review recent support reports."
    >
      <div className="mx-auto max-w-5xl">
        <PassengerSafetyContent />
      </div>
    </PassengerSectionShell>
  );
}
