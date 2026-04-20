import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(null);

  const { data } = await supabase
    .from("reviews")
    .select("id, rating, content")
    .eq("book_id", id)
    .eq("user_id", user.id)
    .single();

  return NextResponse.json(data ?? null);
}