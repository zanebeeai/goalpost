import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { redirectTargetPath } from "@/lib/redirect-target";
import { createClient } from "@/lib/supabase/server";

// Email links land here with a token hash rather than a PKCE code, so they
// work in a different browser or device than the one that asked for them.
const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const type = searchParams.get("type");
  const tokenHash = searchParams.get("token_hash");
  const fallback = type === "recovery" ? "/auth/update-password" : "/app";
  const siteOrigin = new URL(getPublicEnv().siteUrl).origin;
  const next = redirectTargetPath(
    searchParams.get("next"),
    [origin, siteOrigin],
    fallback,
  );

  if (isSupabaseConfigured() && tokenHash && type && OTP_TYPES.has(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  const failure = new URL("/auth/login", origin);
  if (type === "recovery") {
    failure.searchParams.set("error", "reset");
  } else {
    failure.searchParams.set("error", "confirm");
    failure.searchParams.set("next", next);
  }
  return NextResponse.redirect(failure);
}
