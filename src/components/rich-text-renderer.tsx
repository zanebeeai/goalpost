import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Json } from "@/types/domain";

type Mark = { type?: string; attrs?: { href?: string; target?: string } };
type Node = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Mark[];
  content?: Node[];
};

function safeHref(href: string | undefined) {
  if (!href) return null;
  try {
    const url = new URL(href);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return href.startsWith("/") ? href : null;
  }
}

function renderNode(node: Node, key: number | string): React.ReactNode {
  if (node.type === "text") {
    let output: React.ReactNode = node.text ?? "";
    for (const [index, mark] of (node.marks ?? []).entries()) {
      if (mark.type === "bold")
        output = <strong key={`${key}-b-${index}`}>{output}</strong>;
      if (mark.type === "italic")
        output = <em key={`${key}-i-${index}`}>{output}</em>;
      if (mark.type === "strike")
        output = <s key={`${key}-s-${index}`}>{output}</s>;
      if (mark.type === "code")
        output = (
          <code
            key={`${key}-c-${index}`}
            className="rounded bg-[var(--cream-100)] px-1.5 py-0.5 text-[.9em]"
          >
            {output}
          </code>
        );
      if (mark.type === "link") {
        const href = safeHref(mark.attrs?.href);
        if (href)
          output = (
            <Link
              key={`${key}-l-${index}`}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer noopener"
              className="font-semibold text-[var(--forest-700)] underline underline-offset-2"
            >
              {output}
            </Link>
          );
      }
    }
    return output;
  }
  const children =
    node.content?.map((child, index) => renderNode(child, `${key}-${index}`)) ??
    null;
  switch (node.type) {
    case "doc":
      return <>{children}</>;
    case "paragraph":
      return <p key={key}>{children || <br />}</p>;
    case "heading": {
      const level = Math.min(3, Math.max(1, Number(node.attrs?.level ?? 2)));
      return level === 1 ? (
        <h2 key={key}>{children}</h2>
      ) : level === 2 ? (
        <h3 key={key}>{children}</h3>
      ) : (
        <h4 key={key}>{children}</h4>
      );
    }
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{children}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    default:
      return <span key={key}>{children}</span>;
  }
}

export function RichTextRenderer({
  content,
  className,
}: {
  content: Json;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "[&_h2]:font-display [&_h3]:font-display space-y-3 text-sm leading-7 text-[var(--muted)] [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[var(--forest-950)] [&_pre]:p-4 [&_pre]:text-white [&_ul]:list-disc",
        className,
      )}
    >
      {renderNode(content as Node, "root")}
    </div>
  );
}
