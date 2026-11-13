import { describe, expect, it } from "vitest";
import { canonicalTimezone, timezoneSchema } from "./validation";

describe("canonicalTimezone", () => {
  it("returns the canonical IANA spelling", () => {
    expect(canonicalTimezone("pacific/pago_pago")).toBe("Pacific/Pago_Pago");
    expect(canonicalTimezone(" America/New_York ")).toBe("America/New_York");
  });

  it("returns null for unknown zones", () => {
    expect(canonicalTimezone("Not/AZone")).toBeNull();
    expect(canonicalTimezone("")).toBeNull();
  });
});

describe("timezoneSchema", () => {
  it("canonicalises before the value is sent to the database", () => {
    expect(timezoneSchema.parse("europe/london")).toBe("Europe/London");
  });

  it("rejects unknown zones", () => {
    expect(timezoneSchema.safeParse("Mars/Base").success).toBe(false);
    expect(timezoneSchema.safeParse(undefined).success).toBe(false);
  });
});
