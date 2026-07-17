import { describe, expect, it } from "vitest";
import { hostnameFromUrl, safeRedirectPath, slugifyTag } from "@/lib/utils";

describe("security-sensitive utility functions", () => {
  it("rejects protocol-relative and external redirects", () => {
    expect(safeRedirectPath("//evil.example")).toBe("/app");
    expect(safeRedirectPath("https://evil.example")).toBe("/app");
    expect(safeRedirectPath("/app/tree")).toBe("/app/tree");
  });
  it("normalizes tag values", () =>
    expect(slugifyTag("Home Lab!!")).toBe("home-lab"));
  it("shows a link hostname without www", () =>
    expect(hostnameFromUrl("https://www.example.com/path")).toBe(
      "example.com",
    ));
});
