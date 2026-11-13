import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";

const PROTECTED = [/^\/app(\/|$)/, /^\/onboarding\/?$/, /^\/join(\/|$)/];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED.some((pattern) => pattern.test(pathname));
}

/** Invite links go to signup (a new friend has no account); the rest to login. */
export function signedOutRedirectPath(pathname: string): string {
  return /^\/join(\/|$)/.test(pathname) ? "/auth/signup" : "/auth/login";
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const env = getPublicEnv();
  const supabase = createServerClient(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Do not run code between creating the client and getClaims(): it refreshes
  // the session cookie when needed.
  const { data } = await supabase.auth.getClaims();

  const { pathname, search } = request.nextUrl;
  if (!data?.claims && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = signedOutRedirectPath(pathname);
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}
