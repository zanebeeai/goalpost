import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";

export function AuthHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: ReactNode;
}) {
  return (
    <>
      <h1 className="font-display text-[2rem] leading-tight font-semibold tracking-tight wrap-anywhere text-forest-900">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-[15px] leading-relaxed wrap-anywhere text-muted">
          {subtitle}
        </p>
      ) : null}
    </>
  );
}

/** Centered card for auth, onboarding and invite screens. Without a title,
 *  the children render their own heading. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title?: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main
      id="content"
      tabIndex={-1}
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10 sm:justify-center sm:pt-10"
    >
      <Link
        href="/"
        className="mb-10 inline-flex min-h-11 items-center self-start rounded-lg sm:mb-8"
      >
        <Brand />
      </Link>
      <div className="sm:rounded-3xl sm:border sm:border-line sm:bg-card sm:p-8 sm:shadow-[0_8px_24px_-12px_rgb(31_43_36/0.12)]">
        {title ? (
          <>
            <AuthHeading title={title} subtitle={subtitle} />
            <div className="mt-7">{children}</div>
          </>
        ) : (
          children
        )}
      </div>
      {footer ? (
        <div className="mt-6 text-center text-[15px] text-muted">{footer}</div>
      ) : null}
    </main>
  );
}

/** A standalone text link with a 44px tap target. */
export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded px-1 font-semibold text-forest-700 underline underline-offset-2"
    >
      {children}
    </Link>
  );
}
