// app/api/library/route.ts
import { createClient } from "@/lib/supabase/server";
import { getUserLibrary } from "@/services/library.service";

import { NextResponse } from "next/server";

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