import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["admin", "admin_developer"];

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

  const { data: { user } } = await supabase.auth.getUser();

  // Auth callback must pass through untouched — it handles its own redirect
  if (pathname.startsWith("/auth/callback")) {
    return response;
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/agent-portal/login?next=/admin", request.url));
    }

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .maybeSingle();

    const roleName = roleRow?.roles?.name ?? null;

    if (!ADMIN_ROLES.includes(roleName)) {
      return NextResponse.redirect(new URL("/agent-portal/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|images|fonts).*)",
  ],
};
