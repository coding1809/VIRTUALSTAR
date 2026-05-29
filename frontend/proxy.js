import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Refresh session on every request so server components always see a valid token.
  const { data: { user } } = await supabase.auth.getUser();

  // Let the auth callback through unconditionally.
  if (pathname.startsWith("/auth/callback")) return response;

  if (!user) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/agent-portal/login?next=/admin", request.url));
    }
    if (pathname.startsWith("/agent-portal/dashboard")) {
      return NextResponse.redirect(new URL("/agent-portal/login?next=/agent-portal/dashboard", request.url));
    }
  }

  // Role check is intentionally left to the admin layout (uses service client, bypasses RLS).
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|images|fonts).*)",
  ],
};
