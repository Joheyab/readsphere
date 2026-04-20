import { createClient } from "@/lib/supabase/server";
import { getFollowStats } from "@/services/follows.service";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await getFollowStats(user.id);
  return NextResponse.json(stats);
}