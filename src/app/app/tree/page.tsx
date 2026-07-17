import { TreePine } from "lucide-react";
import { CreateGoalButton } from "@/components/create-menu";
import { GoalTree } from "@/components/goal-tree";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireProfile } from "@/lib/auth";
import { getGoalsForUser } from "@/lib/data";

export default async function MyTreePage() {
  const profile = await requireProfile();
  const goals = await getGoalsForUser(profile.id);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Public history"
        title="My goalpost tree"
        description="Newest growth appears at the top. Completed work stays rooted here as an achievement."
        actions={
          <CreateGoalButton
            parents={goals.map(({ id, title }) => ({ id, title }))}
          />
        }
      />
      {goals.length ? (
        <GoalTree goals={goals} />
      ) : (
        <EmptyState
          icon={TreePine}
          title="Your tree has room to grow"
          description="Create a public goal directly, or promote an idea when you decide it is time to begin."
          action={<CreateGoalButton />}
        />
      )}
    </div>
  );
}
