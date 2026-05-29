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

  // Always call getUser to refresh session tokens
  const { data: { user } } = await supabase.auth.getUser();

  if (pathname.startsWith("/auth/callback")) {
    return response;
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/agent-portal/login?next=/admin", request.url));
    }

    // Two-query lookup — FK join syntax requires cached schema, silently returns null
    const { data: urRow } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let roleName = null;
    if (urRow?.role_id != null) {
      const { data: roleData } = await supabase
        .from("roles")
        .select("name")
        .eq("id", urRow.role_id)
        .single();
      roleName = roleData?.name ?? null;
    }

    if (!ADMIN_ROLES.includes(roleName)) {
      return NextResponse.redirect(new URL("/agent-portal/login?denied=1", request.url));
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
