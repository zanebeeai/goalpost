"use client";

import { useSyncExternalStore } from "react";
import { ChevronDown } from "lucide-react";
import { useFieldErrorProps } from "@/components/action-form";

const subscribe = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverZone = () => "";

function label(zone: string) {
  return zone.replaceAll("_", " ");
}

/** Timezone picker with this device's timezone at the top. */
export function TimezoneSelect({
  zones,
  value,
}: {
  zones: string[];
  value: string;
}) {
  const device = useSyncExternalStore(subscribe, browserZone, serverZone);
  const errorProps = useFieldErrorProps();
  const deviceListed = device && zones.includes(device);
  return (
    <div className="relative">
      <select
        id="timezone"
        name="timezone"
        defaultValue={value}
        {...errorProps}
        className="h-12 w-full appearance-none rounded-xl border border-line bg-white/70 pr-10 pl-3.5 text-base text-ink outline-none hover:border-moss-400 focus:border-forest-500 focus:ring-3 focus:ring-moss-100"
      >
        {deviceListed ? (
          <optgroup label="This device's timezone">
            <option value={device}>{label(device)}</option>
          </optgroup>
        ) : null}
        <optgroup label="All timezones">
          {zones
            .filter((zone) => !deviceListed || zone !== device)
            .map((zone) => (
              <option key={zone} value={zone}>
                {label(zone)}
              </option>
            ))}
        </optgroup>
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-[18px] -translate-y-1/2 text-muted"
      />
    </div>
  );
}
