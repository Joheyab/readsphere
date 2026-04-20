// app/api/library/route.ts
import { createClient } from "@/lib/supabase/server";
import { getUserLibrary } from "@/services/library.service";

import { NextResponse, NextRequest } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await getUserLibrary(user.id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener la biblioteca" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { book_id, status } = await request.json();

  const { error } = await supabase.from("user_library").insert({
    user_id: user.id,
    book_id,
    status,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}