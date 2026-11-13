import { ArrowRight } from "lucide-react";
import { pickTopicAction } from "@/app/actions/week";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, Eyebrow } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UpNextTopic } from "@/lib/data";

export function PickTopic({ upNext }: { upNext: UpNextTopic[] }) {
  return (
    <Card className="border-forest-500/40 shadow-[0_1px_2px_rgb(31_43_36/0.05),0_12px_32px_-14px_rgb(31_43_36/0.18)]">
      <Eyebrow>Your week</Eyebrow>
      <ActionForm action={pickTopicAction} className="mt-2">
        <label
          htmlFor="topic"
          className="block font-display text-2xl leading-snug font-semibold text-forest-900"
        >
          What are you learning this week?
        </label>
        <div className="mt-4 flex gap-2">
          <Input
            id="topic"
            name="topic"
            required
            maxLength={120}
            autoComplete="off"
            placeholder="Sourdough starters"
          />
          <SubmitButton size="lg" className="px-6">
            Pick
          </SubmitButton>
        </div>
      </ActionForm>

      {upNext.length > 0 ? (
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-sm font-semibold text-muted">
            Or take one from Up next
          </p>
          <ActionForm
            action={pickTopicAction}
            className="mt-2"
            aria-label="Pick from Up next"
          >
            <ul className="space-y-2">
              {upNext.map((topic) => (
                <li key={topic.id}>
                  <SubmitButton
                    name="topicId"
                    value={topic.id}
                    variant="soft"
                    className="h-auto min-h-12 w-full min-w-0 shrink justify-between px-4 py-2.5 text-left font-semibold wrap-anywhere whitespace-normal"
                  >
                    <span className="min-w-0">{topic.title}</span>
                    <ArrowRight aria-hidden className="text-forest-500" />
                  </SubmitButton>
                </li>
              ))}
            </ul>
          </ActionForm>
        </div>
      ) : null}
    </Card>
  );
}
