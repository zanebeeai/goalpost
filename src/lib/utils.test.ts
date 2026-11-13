import { describe, expect, it } from "vitest";
import { cn, initials, safeRedirectPath } from "./utils";

describe("cn", () => {
  it("joins classes and resolves Tailwind conflicts", () => {
    expect(cn("px-2", false && "hidden", "px-4", ["text-sm"])).toBe(
      "px-4 text-sm",
    );
  });
});

describe("initials", () => {
  it("takes up to two initials", () => {
    expect(initials("Tony Pan")).toBe("TP");
    expect(initials("  ada  ")).toBe("A");
    expect(initials("Mary Jane Watson")).toBe("MJ");
    expect(initials("")).toBe("");
  });
});

describe("safeRedirectPath", () => {
  it("keeps same-origin paths", () => {
    expect(safeRedirectPath("/join/abc123")).toBe("/join/abc123");
    expect(safeRedirectPath("/app/next?x=1")).toBe("/app/next?x=1");
  });

  it("rejects anything that could leave the site", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/app");
    expect(safeRedirectPath("//evil.example")).toBe("/app");
    expect(safeRedirectPath("/\\evil.example")).toBe("/app");
    expect(safeRedirectPath("/\tevil")).toBe("/app");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/app");
    expect(safeRedirectPath(null)).toBe("/app");
    expect(safeRedirectPath(undefined, "/onboarding")).toBe("/onboarding");
  });
});
