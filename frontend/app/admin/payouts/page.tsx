"use client";

import { useCallback } from "react";
import { Wallet } from "lucide-react";
import {
  AdminShell,
  PanelHeader,
  StatusPill,
  type PayoutRequest,
  useAdminRealtime
} from "@/components/qiilu/admin-ops";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api";

export default function AdminPayoutsPage() {
  const loadPayouts = useCallback(
    () => fetchJson<{ payouts: PayoutRequest[] }>("/admin/payouts"),
    []
  );
  const { data, setData, message, setMessage } = useAdminRealtime(loadPayouts, { payouts: [] });

  const processPayout = async (payoutId: string, action: "process" | "approve" | "reject") => {
    await fetchJson(`/admin/payouts/${payoutId}/${action}`, {
      method: "POST",
      body: JSON.stringify({ reviewerNotes: `Handled from Qiilu admin on ${new Date().toISOString()}` })
    });

    const next = await loadPayouts();
    setData(next);
    setMessage(`Payout moved to ${action}.`);
  };

  const totalPending = data.payouts.filter((item) => item.status === "PENDING").length;
  const totalProcessing = data.payouts.filter((item) => item.status === "PROCESSING").length;
  const totalValue = data.payouts.reduce((sum, item) => sum + item.amountGhs, 0);

  return (
    <AdminShell
      title="Payout Control"
      subtitle="Handle driver payout requests with a dedicated finance queue that keeps approval work separate from the rest of operations."
      metrics={[
        { label: "Pending", value: `${totalPending}` },
        { label: "Processing", value: `${totalProcessing}` },
        { label: "Queue value", value: `GHS ${totalValue.toFixed(2)}` },
        { label: "Sync status", value: message }
      ]}
      rail={
        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(132,204,22,0.12),rgba(14,165,233,0.10))] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Wallet className="h-4 w-4 text-primary" />
            Finance watch
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>Use this page to clear payout backlog quickly without switching through KYC, safety, or dispatch panels.</div>
            <div className="font-semibold text-foreground">{message}</div>
          </div>
        </div>
      }
    >
      <section className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
        <PanelHeader title="Payout queue" meta="Approve and track MoMo payout requests from drivers" />
        <div className="grid gap-3">
          {data.payouts.length ? data.payouts.map((payout) => (
            <div key={payout.id} className="rounded-[1.3rem] border border-border/80 bg-card/88 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold">{payout.wallet.user.name}</div>
                  <div className="text-sm text-muted-foreground">{payout.provider} | {payout.accountRef}</div>
                </div>
                <StatusPill
                  label={payout.status}
                  tone={
                    payout.status === "PAID"
                      ? "success"
                      : payout.status === "REJECTED"
                        ? "danger"
                        : payout.status === "PROCESSING"
                          ? "info"
                          : "warning"
                  }
                />
              </div>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Requested amount</div>
                <div className="text-xl font-extrabold">GHS {payout.amountGhs.toFixed(2)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-full" onClick={() => processPayout(payout.id, "process")}>
                  Process
                </Button>
                <Button className="rounded-full" onClick={() => processPayout(payout.id, "approve")}>
                  Approve
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => processPayout(payout.id, "reject")}>
                  Reject
                </Button>
              </div>
            </div>
          )) : <div className="rounded-[1.3rem] border border-dashed border-border p-6 text-center text-muted-foreground">No payouts waiting right now.</div>}
        </div>
      </section>
    </AdminShell>
  );
}
