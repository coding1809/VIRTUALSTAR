import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(toSet) {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* Server Component — cookies set in middleware instead */ }
        },
      },
    }
  );
}

// Service-role client for admin operations that bypass RLS
export function createServiceClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Two-query role lookup — avoids FK join syntax that may not be cached by PostgREST
export async function getUserRole(db, userId) {
  const { data: urRow } = await db
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!urRow?.role_id) return null;
  const { data: roleData } = await db
    .from("roles")
    .select("name")
    .eq("id", urRow.role_id)
    .single();
  return roleData?.name ?? null;
}
