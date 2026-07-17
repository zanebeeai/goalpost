"use client";

import { useState } from "react";
import { ListPlus, Plus, Sprout } from "lucide-react";
import { GoalUpdateForm, NewGoalForm } from "@/components/goal-forms";
import { NewListForm } from "@/components/idea-forms";
import { NewDialog } from "@/components/new-dialog";
import { Button } from "@/components/ui/button";

export function CreateListButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <ListPlus className="size-4" />
        New list
      </Button>
      <NewDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Create an idea list"
      >
        <NewListForm />
      </NewDialog>
    </>
  );
}

export function CreateGoalButton({
  parents = [],
}: {
  parents?: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Sprout className="size-4" />
        New goal
      </Button>
      <NewDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Plant a new goalpost"
      >
        <NewGoalForm parents={parents} />
      </NewDialog>
    </>
  );
}

export function AddUpdateButton({
  goalpostId,
  publicId,
}: {
  goalpostId: string;
  publicId: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="size-4" />
        Add update
      </Button>
      <NewDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Share a progress update"
      >
        <GoalUpdateForm goalpostId={goalpostId} publicId={publicId} />
      </NewDialog>
    </>
  );
}
