"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckSquare,
  GripVertical,
  MessageCircle,
  Paperclip,
} from "lucide-react";
import { reorderIdeasAction } from "@/app/actions/ideas";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { richTextToPlainText } from "@/lib/rich-text";
import type { IdeaCard } from "@/types/domain";

function SortableIdea({
  idea,
  listId,
  draggable,
}: {
  idea: IdeaCard;
  listId: string;
  draggable: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: idea.id, disabled: !draggable });
  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative p-5 ${isDragging ? "z-20 opacity-70 shadow-2xl" : ""}`}
    >
      {draggable ? (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute top-3 right-3 cursor-grab rounded-lg p-1.5 text-[var(--muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--cream-100)] focus:opacity-100"
          aria-label={`Reorder ${idea.title}`}
        >
          <GripVertical className="size-4" />
        </button>
      ) : null}
      <Link
        href={`/app/ideas/${listId}?idea=${idea.id}`}
        className="focus-ring block rounded-lg pr-5"
      >
        {idea.tags.length ? (
          <div className="mb-3 flex flex-wrap gap-1">
            {idea.tags.slice(0, 3).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}
        <h3 className="font-display text-xl leading-snug font-semibold">
          {idea.title}
        </h3>
        {richTextToPlainText(idea.content) ? (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
            {richTextToPlainText(idea.content)}
          </p>
        ) : null}
        <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-[var(--muted)]">
          {idea.checklistTotal ? (
            <span className="flex items-center gap-1">
              <CheckSquare className="size-3.5" />
              {idea.checklistDone}/{idea.checklistTotal}
            </span>
          ) : null}
          {idea.attachmentCount ? (
            <span className="flex items-center gap-1">
              <Paperclip className="size-3.5" />
              {idea.attachmentCount}
            </span>
          ) : null}
          {idea.commentCount ? (
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3.5" />
              {idea.commentCount}
            </span>
          ) : null}
        </div>
      </Link>
    </Card>
  );
}

export function IdeaBoard({
  initialIdeas,
  listId,
  draggable,
}: {
  initialIdeas: IdeaCard[];
  listId: string;
  draggable: boolean;
}) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = ideas.findIndex((item) => item.id === active.id);
    const newIndex = ideas.findIndex((item) => item.id === over.id);
    const next = arrayMove(ideas, oldIndex, newIndex);
    setIdeas(next);
    startTransition(
      () =>
        void reorderIdeasAction(
          next.map((item) => item.id),
          listId,
        ),
    );
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={ideas.map((idea) => idea.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ideas.map((idea) => (
            <SortableIdea
              key={idea.id}
              idea={idea}
              listId={listId}
              draggable={draggable}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
