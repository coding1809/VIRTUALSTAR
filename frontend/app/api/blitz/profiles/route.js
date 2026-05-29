import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../lib/supabase/server";

// Returns public profile info (name, avatar, role) for a given list of user IDs.
// Uses the service client so RLS on the users table never blocks leaderboard data.
export async function POST(request) {
  const { userIds } = await request.json();
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ profiles: [], roles: {} });
  }

  const db = createServiceClient();

  const [{ data: profiles }, { data: urRows }] = await Promise.all([
    db.from("users").select("id, display_name, avatar_url").in("id", userIds),
    db.from("user_roles").select("user_id, role_id").in("user_id", userIds),
  ]);

  const roleIds = [...new Set((urRows || []).map(r => r.role_id).filter(Boolean))];
  const { data: rolesData } = roleIds.length
    ? await db.from("roles").select("id, name").in("id", roleIds)
    : { data: [] };

  const roleNameById = Object.fromEntries((rolesData || []).map(r => [r.id, r.name]));
  const roleByUser = Object.fromEntries(
    (urRows || []).map(r => [r.user_id, roleNameById[r.role_id] ?? null])
  );

  return NextResponse.json({ profiles: profiles ?? [], roleByUser });
}
