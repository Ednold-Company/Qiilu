type AuditAction =
  | "kyc.review"
  | "payout.process"
  | "payout.approve"
  | "payout.reject"
  | "incident.resolve";

export function logAdminAction(input: {
  requestId?: string;
  actorId: string;
  action: AuditAction;
  targetType: "kyc_submission" | "payout_request" | "support_incident";
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  console.log(
    JSON.stringify({
      scope: "qiilu.audit",
      timestamp: new Date().toISOString(),
      requestId: input.requestId ?? null,
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ?? {}
    })
  );
}
