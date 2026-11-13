// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isProtectedPath, signedOutRedirectPath } from "./proxy";

describe("signed-out redirects", () => {
  it("protects the app, onboarding and invite links", () => {
    for (const path of ["/app", "/app/next", "/onboarding", "/join/abc"]) {
      expect(isProtectedPath(path)).toBe(true);
    }
    for (const path of ["/", "/privacy", "/auth/login", "/joinery", "/apple"]) {
      expect(isProtectedPath(path)).toBe(false);
    }
  });

  it("sends invite links to signup and everything else to login", () => {
    expect(signedOutRedirectPath("/join/abc123")).toBe("/auth/signup");
    expect(signedOutRedirectPath("/app")).toBe("/auth/login");
    expect(signedOutRedirectPath("/app/history")).toBe("/auth/login");
    expect(signedOutRedirectPath("/onboarding")).toBe("/auth/login");
  });
});
