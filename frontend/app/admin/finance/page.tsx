"use client";

import { useCallback } from "react";
import { BadgeDollarSign, ShieldCheck, Wallet } from "lucide-react";
import {
  AdminShell,
  PanelHeader,
  StatusPill,
  type Incident,
  type PayoutRequest,
  useAdminRealtime
} from "@/components/qiilu/admin-ops";
import { fetchJson } from "@/lib/api";

type FinancePayload = {
  payouts: PayoutRequest[];
  incidents: Incident[];
};

function currency(value: number) {
  return `GHS ${value.toFixed(2)}`;
}

export default function AdminFinancePage() {
  const loadFinance = useCallback(async (): Promise<FinancePayload> => {
    const [payoutsPayload, incidentsPayload] = await Promise.all([
      fetchJson<{ payouts: PayoutRequest[] }>("/admin/payouts"),
      fetchJson<{ incidents: Incident[] }>("/admin/incidents")
    ]);

    return {
      payouts: payoutsPayload.payouts,
      incidents: incidentsPayload.incidents
    };
  }, []);

  const { data, message } = useAdminRealtime(loadFinance, { payouts: [], incidents: [] });

  const pendingPayouts = data.payouts.filter((item) => item.status === "PENDING");
  const processingPayouts = data.payouts.filter((item) => item.status === "PROCESSING");
  const paidPayouts = data.payouts.filter((item) => item.status === "PAID");
  const openIncidents = data.incidents.filter((item) => item.status === "OPEN" || item.status === "INVESTIGATING");
  const criticalIncidents = openIncidents.filter((item) => item.severity === "CRITICAL");

  const pendingValue = pendingPayouts.reduce((sum, item) => sum + item.amountGhs, 0);
  const processingValue = processingPayouts.reduce((sum, item) => sum + item.amountGhs, 0);
  const paidValue = paidPayouts.reduce((sum, item) => sum + item.amountGhs, 0);

  const topPending = [...pendingPayouts].sort((a, b) => b.amountGhs - a.amountGhs).slice(0, 5);
  const financeSignals = [
    {
      label: "Cash-out pressure",
      value: `${pendingPayouts.length} waiting`,
      tone: pendingPayouts.length > 3 ? ("warning" as const) : ("success" as const)
    },
    {
      label: "In-flight payouts",
      value: `${processingPayouts.length} processing`,
      tone: processingPayouts.length ? ("info" as const) : ("neutral" as const)
    },
    {
      label: "Risk watch",
      value: `${criticalIncidents.length} critical incidents`,
      tone: criticalIncidents.length ? ("danger" as const) : ("success" as const)
    }
  ];

  return (
    <AdminShell
      title="Finance Overview"
      subtitle="A higher-level finance surface for payout exposure, queue health, and safety-linked operational risk."
      metrics={[
        { label: "Pending value", value: currency(pendingValue) },
        { label: "Processing value", value: currency(processingValue) },
        { label: "Paid value", value: currency(paidValue) },
        { label: "Sync status", value: message }
      ]}
      rail={
        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(132,204,22,0.12),rgba(249,115,22,0.10))] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BadgeDollarSign className="h-4 w-4 text-primary" />
            Finance pulse
          </div>
          <div className="space-y-3">
            {financeSignals.map((signal) => (
              <div key={signal.label} className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/70 px-3 py-2">
                <div>
                  <div className="text-sm font-semibold">{signal.label}</div>
                  <div className="text-xs text-muted-foreground">Executive signal</div>
                </div>
                <StatusPill label={signal.value} tone={signal.tone} />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
          <PanelHeader title="Payout exposure" meta="See where cash-out pressure is building before moving into detailed payout processing." />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-border/80 bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Wallet className="h-4 w-4 text-primary" />
                Pending
              </div>
              <div className="text-3xl font-extrabold tracking-tight">{currency(pendingValue)}</div>
              <div className="mt-1 text-sm text-muted-foreground">{pendingPayouts.length} driver cash-outs waiting for action</div>
            </div>
            <div className="rounded-[1.5rem] border border-border/80 bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <BadgeDollarSign className="h-4 w-4 text-primary" />
                Processing
              </div>
              <div className="text-3xl font-extrabold tracking-tight">{currency(processingValue)}</div>
              <div className="mt-1 text-sm text-muted-foreground">{processingPayouts.length} payouts are actively being handled</div>
            </div>
            <div className="rounded-[1.5rem] border border-border/80 bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Paid
              </div>
              <div className="text-3xl font-extrabold tracking-tight">{currency(paidValue)}</div>
              <div className="mt-1 text-sm text-muted-foreground">{paidPayouts.length} requests already settled</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 text-sm font-semibold text-muted-foreground">Largest pending payouts</div>
            <div className="grid gap-3">
              {topPending.length ? topPending.map((payout) => (
                <div key={payout.id} className="flex flex-col gap-3 rounded-[1.3rem] border border-border/80 bg-card/88 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-bold">{payout.wallet.user.name}</div>
                    <div className="text-sm text-muted-foreground">{payout.provider} | {payout.accountRef}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill label={payout.status} tone="warning" />
                    <div className="text-lg font-extrabold">{currency(payout.amountGhs)}</div>
                  </div>
                </div>
              )) : <div className="rounded-[1.3rem] border border-dashed border-border p-6 text-center text-muted-foreground">No pending payouts right now.</div>}
            </div>
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
          <PanelHeader title="Risk and support pressure" meta="Finance risk is never isolated in transport ops, so this view keeps incident severity nearby." />
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-border/80 bg-muted/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Open safety load</div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight">{openIncidents.length}</div>
              <div className="mt-1 text-sm text-muted-foreground">open or investigating incidents alongside payout operations</div>
            </div>
            <div className="rounded-[1.5rem] border border-border/80 bg-muted/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Critical cases</div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight">{criticalIncidents.length}</div>
              <div className="mt-1 text-sm text-muted-foreground">critical incidents that may require tighter finance caution</div>
            </div>
            <div className="rounded-[1.5rem] border border-border/80 bg-muted/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ops notes</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Use this page for prioritization and exposure review.</li>
                <li>Use <span className="font-semibold text-foreground">/admin/payouts</span> for actual payout processing actions.</li>
                <li>Use <span className="font-semibold text-foreground">/admin/safety</span> when incident triage becomes the main task.</li>
              </ul>
            </div>
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
