import { Archive } from "lucide-react";
import { IdeaStack } from "@/components/idea-stack";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getIdeas } from "@/lib/data";

export default async function ArchivePage() {
  const ideas = await getIdeas({ status: "archived" });
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Across every accessible list"
        title="Archive stack"
        description="Ideas you set aside without calling finished. Restore one whenever it becomes relevant again."
      />
      {ideas.length ? (
        <IdeaStack ideas={ideas} status="archived" />
      ) : (
        <EmptyState
          icon={Archive}
          title="The archive is empty"
          description="Archived cards from every list you can access will gather here."
        />
      )}
    </div>
  );
}
