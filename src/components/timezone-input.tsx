"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverZone = () => "";

/** Hidden field carrying the browser's IANA timezone. */
export function TimezoneInput({ name = "timezone" }: { name?: string }) {
  const zone = useSyncExternalStore(subscribe, browserZone, serverZone);
  return <input type="hidden" name={name} value={zone} />;
}
