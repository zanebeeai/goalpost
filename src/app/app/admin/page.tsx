import { redirect } from "next/navigation";
import { Flag, ShieldAlert } from "lucide-react";
import { resolveReportAction, suspendAccountAction } from "@/app/actions/admin";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { getAdminReports } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type Row = Record<string, unknown>;

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user?.app_metadata.role !== "admin") redirect("/app");
  const reports = await getAdminReports();
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Restricted"
        title="Moderation review"
        description="Review reports, hide violating public content, and suspend abusive accounts. Every decision is written to an immutable audit log."
      />
      <section>
        <h2 className="font-display mb-3 text-xl font-semibold">Open queue</h2>
        {reports.length ? (
          <div className="space-y-3">
            {reports.map((report) => {
              const reporter = (report.profiles ?? {}) as Row;
              return (
                <Card key={String(report.id)} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex gap-2">
                        <Badge>{String(report.status)}</Badge>
                        <Badge>{String(report.target_type)}</Badge>
                      </div>
                      <h3 className="mt-3 font-bold">
                        {String(report.reason)}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {String(report.details ?? "No further details")}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      Reported by @{String(reporter.username ?? "deleted")}
                      <br />
                      {formatDate(String(report.created_at), true)}
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {["resolved", "dismissed"].map((status) => (
                      <form action={resolveReportAction} key={status}>
                        <input
                          type="hidden"
                          name="reportId"
                          value={String(report.id)}
                        />
                        <input
                          type="hidden"
                          name="targetType"
                          value={String(report.target_type)}
                        />
                        <input
                          type="hidden"
                          name="targetId"
                          value={String(report.target_id)}
                        />
                        <input type="hidden" name="status" value={status} />
                        <input
                          type="hidden"
                          name="hide"
                          value={String(status === "resolved")}
                        />
                        <Button
                          type="submit"
                          variant={
                            status === "resolved" ? "danger" : "secondary"
                          }
                          size="sm"
                        >
                          {status === "resolved"
                            ? "Hide and resolve"
                            : "Dismiss"}
                        </Button>
                      </form>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed p-10 text-center">
            <Flag className="mx-auto size-6 text-[var(--moss-600)]" />
            <p className="mt-3 text-sm text-[var(--muted)]">
              No reports are waiting.
            </p>
          </Card>
        )}
      </section>
      <section>
        <h2 className="font-display mb-3 text-xl font-semibold">
          Account enforcement
        </h2>
        <Card className="p-5">
          <form
            action={suspendAccountAction}
            className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto]"
          >
            <Input name="userId" placeholder="Profile UUID" required />
            <Textarea
              name="reason"
              placeholder="Reason for the audit record"
              required
              className="min-h-11"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                name="suspend"
                value="true"
                variant="danger"
                size="sm"
              >
                <ShieldAlert className="size-4" />
                Suspend
              </Button>
              <Button
                type="submit"
                name="suspend"
                value="false"
                variant="secondary"
                size="sm"
              >
                Restore
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
