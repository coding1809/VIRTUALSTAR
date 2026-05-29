import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../../../lib/supabase/server";

// POST /api/admin/form-sources/[id]/assign-owner
export async function POST(request, { params }) {
  const { id } = await params;
  const { owner_user_id } = await request.json();

  if (!owner_user_id) return NextResponse.json({ error: "owner_user_id required" }, { status: 400 });

  const service = createServiceClient();

  // Upsert the ownership record (pending verification)
  const { error } = await service
    .from("form_source_owners")
    .upsert(
      { form_source_id: parseInt(id, 10), owner_user_id, verified_at: null, verification_code_hash: null },
      { onConflict: "form_source_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
