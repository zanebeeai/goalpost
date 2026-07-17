import { CheckCircle2 } from "lucide-react";
import { IdeaStack } from "@/components/idea-stack";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getIdeas } from "@/lib/data";

export default async function DonePage() {
  const ideas = await getIdeas({ status: "done" });
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Across every accessible list"
        title="Done stack"
        description="Ideas that were completed without becoming full public goalposts."
      />
      {ideas.length ? (
        <IdeaStack ideas={ideas} status="done" />
      ) : (
        <EmptyState
          icon={CheckCircle2}
          title="Nothing in the done stack yet"
          description="Mark a finished idea done and it will remain here with its source list."
        />
      )}
    </div>
  );
}
