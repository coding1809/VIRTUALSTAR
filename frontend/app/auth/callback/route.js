import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/agent-portal/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/agent-portal/login?denied=1`);
  }

  const supabase = await createClient();
  const db = createServiceClient();

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/agent-portal/login?denied=1`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/agent-portal/login?denied=1`);
  }

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
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/agent-portal/login?denied=1`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
