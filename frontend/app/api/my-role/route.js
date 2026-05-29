import { NextResponse } from "next/server";
import { createClient, createServiceClient, getUserRole } from "../../../lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ role: null });

  const db = createServiceClient();
  const role = await getUserRole(db, user.id);
  return NextResponse.json({ role: role ?? null });
}
