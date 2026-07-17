"use client";

import { useEffect, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import type { Json } from "@/types/domain";
import { cn } from "@/lib/utils";

export function RichTextEditor({
  name = "content",
  initialContent,
  placeholder = "Add the useful details…",
  compact = false,
}: {
  name?: string;
  initialContent?: Json;
  placeholder?: string;
  compact?: boolean;
}) {
  const initialJson = (initialContent ?? {
    type: "doc",
    content: [],
  }) as JSONContent;
  const [serialized, setSerialized] = useState(() =>
    JSON.stringify(initialJson),
  );
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer nofollow" },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialJson,
    onUpdate: ({ editor: updatedEditor }) =>
      setSerialized(JSON.stringify(updatedEditor.getJSON())),
    editorProps: {
      attributes: {
        class: cn(
          "min-h-32 px-4 py-3 text-sm leading-7 focus:outline-none",
          compact && "min-h-20",
        ),
      },
    },
  });
  useEffect(() => () => editor?.destroy(), [editor]);
  if (!editor)
    return (
      <div className="min-h-32 animate-pulse rounded-xl bg-[var(--cream-100)]" />
    );

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link address", previous ?? "https://");
    if (href === null) return;
    if (!href.trim())
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const tools = [
    {
      label: "Bold",
      icon: Bold,
      active: editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      active: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Heading",
      icon: Heading2,
      active: editor.isActive("heading", { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bulleted list",
      icon: List,
      active: editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      active: editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Quote",
      icon: Quote,
      active: editor.isActive("blockquote"),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Link",
      icon: Link2,
      active: editor.isActive("link"),
      run: setLink,
    },
  ];
  return (
    <div className="overflow-hidden rounded-xl border bg-white focus-within:ring-2 focus-within:ring-[var(--moss-400)]">
      <div className="flex flex-wrap gap-0.5 border-b bg-[var(--cream-50)] p-1.5">
        {tools.map(({ label, icon: Icon, active, run }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={run}
            className={cn(
              "rounded-lg p-2 text-[var(--muted)] hover:bg-white hover:text-[var(--forest-900)]",
              active && "bg-[var(--moss-200)] text-[var(--forest-900)]",
            )}
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={serialized} readOnly />
    </div>
  );
}
