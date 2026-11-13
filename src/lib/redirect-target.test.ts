import { describe, expect, it } from "vitest";
import { redirectTargetPath } from "./redirect-target";

const ORIGINS = ["https://goalpost.example"];

describe("redirectTargetPath", () => {
  it("keeps the path of a same-origin URL", () => {
    expect(
      redirectTargetPath("https://goalpost.example/join/abc", ORIGINS, "/app"),
    ).toBe("/join/abc");
    expect(
      redirectTargetPath(
        "https://goalpost.example/auth/update-password",
        ORIGINS,
        "/app",
      ),
    ).toBe("/auth/update-password");
  });

  it("accepts a plain safe path", () => {
    expect(redirectTargetPath("/onboarding", ORIGINS, "/app")).toBe(
      "/onboarding",
    );
  });

  it("uses the fallback for the bare site URL", () => {
    expect(
      redirectTargetPath("https://goalpost.example", ORIGINS, "/app"),
    ).toBe("/app");
  });

  it("rejects other origins and junk", () => {
    expect(redirectTargetPath("https://evil.example/x", ORIGINS, "/app")).toBe(
      "/app",
    );
    expect(redirectTargetPath("//evil.example", ORIGINS, "/app")).toBe("/app");
    expect(redirectTargetPath("javascript:alert(1)", ORIGINS, "/app")).toBe(
      "/app",
    );
    expect(redirectTargetPath("not a url", ORIGINS, "/app")).toBe("/app");
    expect(redirectTargetPath(null, ORIGINS, "/app")).toBe("/app");
  });
});
