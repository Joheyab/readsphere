import { createClient } from "@/lib/supabase/server";
import { getFeed } from "@/services/feed.service";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await getFeed(user.id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener el feed" }, { status: 500 });
  }
}