import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { createServiceClient } from "../../../lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/agent-portal/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/agent-portal/login?denied=1`);
  }

  // Build the success redirect first so we can attach session cookies to it.
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/agent-portal/login?denied=1`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/agent-portal/login?denied=1`);
  }

  const db = createServiceClient();

  // Upsert user, always syncing display_name/avatar_url from Google metadata.
  await db.from("users").upsert(
    {
      id:           user.id,
      email:        user.email,
      display_name: user.user_metadata?.full_name ?? null,
      avatar_url:   user.user_metadata?.avatar_url ?? null,
      is_active:    true,
    },
    { onConflict: "id", ignoreDuplicates: false }
  );

  const { data: currentUser } = await db
    .from("users")
    .select("id, is_active")
    .eq("id", user.id)
    .single();

  if (!currentUser?.is_active) {
    return NextResponse.redirect(`${origin}/agent-portal/login?denied=1`);
  }

  return response;
}
