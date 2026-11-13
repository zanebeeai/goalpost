import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_SETTINGS_REVALIDATE_SECONDS,
  isGoogleAuthEnabled,
} from "./auth-providers";

const URL = "http://127.0.0.1:54321";
const KEY = "sb_publishable_test";

function settings(external: Record<string, boolean>, status = 200) {
  return new Response(JSON.stringify({ external }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("isGoogleAuthEnabled", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", KEY);
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("is true when Google is enabled", async () => {
    fetchMock.mockResolvedValue(settings({ email: true, google: true }));
    await expect(isGoogleAuthEnabled()).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${URL}/auth/v1/settings`);
    expect(init?.headers).toEqual({ apikey: KEY });
    expect(init?.next).toEqual({
      revalidate: AUTH_SETTINGS_REVALIDATE_SECONDS,
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("is false when Google is disabled", async () => {
    fetchMock.mockResolvedValue(settings({ email: true, google: false }));
    await expect(isGoogleAuthEnabled()).resolves.toBe(false);
  });

  it("is false when the provider is missing from the response", async () => {
    fetchMock.mockResolvedValue(settings({ email: true }));
    await expect(isGoogleAuthEnabled()).resolves.toBe(false);
  });

  it("is false when the request fails or times out", async () => {
    fetchMock.mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    await expect(isGoogleAuthEnabled()).resolves.toBe(false);
  });

  it("is false on an error status", async () => {
    fetchMock.mockResolvedValue(settings({ google: true }, 401));
    await expect(isGoogleAuthEnabled()).resolves.toBe(false);
  });

  it("is false on a body that is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 200 }));
    await expect(isGoogleAuthEnabled()).resolves.toBe(false);
  });

  it("is false without Supabase env and does not call out", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    await expect(isGoogleAuthEnabled()).resolves.toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    await expect(isGoogleAuthEnabled()).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
