import { Fragment } from "react";
import { cn } from "@/lib/utils";

const URL_PATTERN = /(https?:\/\/[^\s<>"']+)/g;
const TRAILING = /[.,;:!?)\]}'"]+$/;

/** Plain text with line breaks kept and http(s) URLs turned into links. */
export function LinkifiedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = text.split(URL_PATTERN);
  return (
    <p className={cn("wrap-anywhere whitespace-pre-wrap", className)}>
      {parts.map((part, index) => {
        if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
        const trailing = TRAILING.exec(part)?.[0] ?? "";
        const href = trailing ? part.slice(0, -trailing.length) : part;
        return (
          <Fragment key={index}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-forest-500 underline decoration-moss-400 underline-offset-2 hover:decoration-forest-500"
            >
              {href}
            </a>
            {trailing}
          </Fragment>
        );
      })}
    </p>
  );
}
