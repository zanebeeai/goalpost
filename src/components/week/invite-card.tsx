import { ShareButton } from "@/components/share-button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Shown while the space has one member. Quiet until the first topic is
 * picked, so picking stays the one obvious thing to do.
 */
export function InviteCard({
  inviteUrl,
  quiet = false,
}: {
  inviteUrl: string;
  quiet?: boolean;
}) {
  return (
    <Card
      className={cn(
        quiet
          ? "border-dashed bg-transparent shadow-none"
          : "border-moss-400/60 bg-moss-100/50",
      )}
    >
      <h2
        className={cn(
          "font-display leading-snug font-semibold text-forest-900",
          quiet ? "text-xl" : "text-2xl",
        )}
      >
        Goalpost works best with a partner
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-forest-700">
        Send a friend this link. You&apos;ll see each other&apos;s week and swap
        questions on Friday.
      </p>
      <p className="mt-4 truncate rounded-xl border border-line bg-card px-3.5 py-3 font-mono text-sm text-muted">
        {inviteUrl}
      </p>
      <ShareButton
        className={cn("mt-4", !quiet && "w-full sm:w-auto")}
        variant={quiet ? "secondary" : "primary"}
        label="Send invite"
        text="Join me on Goalpost. We each pick something to learn on Sunday and interview each other on Friday."
        url={inviteUrl}
      />
    </Card>
  );
}
