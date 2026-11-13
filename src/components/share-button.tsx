"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isApplePlatform(): boolean {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ??
    navigator.platform ??
    "";
  return (
    /Mac|iPhone|iPad|iPod/i.test(platform) ||
    /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
  );
}

/**
 * Opens the share sheet (Messages on iPhone). Falls back to an sms: link on
 * Apple devices, and to copying the text elsewhere.
 */
export function ShareButton({
  text,
  url,
  label,
  variant = "secondary",
  size = "md",
  className,
}: {
  text: string;
  url: string;
  label: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }
    const message = `${text} ${url}`;
    if (isApplePlatform()) {
      window.location.href = `sms:&body=${encodeURIComponent(message)}`;
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      // Labels can carry a member's name; never let them widen the page.
      className={cn("max-w-full min-w-0", className)}
      title={label}
      onClick={share}
    >
      {copied ? <Check aria-hidden /> : <Send aria-hidden />}
      <span aria-live="polite" className="min-w-0 truncate">
        {copied ? "Copied" : label}
      </span>
    </Button>
  );
}
