"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function NewDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(92vw,560px)] rounded-[1.5rem] border bg-[var(--white)] p-0 text-[var(--ink)] shadow-2xl backdrop:bg-[var(--forest-950)]/45"
    >
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring rounded-full p-2 hover:bg-[var(--cream-100)]"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto p-6">{children}</div>
    </dialog>
  );
}
