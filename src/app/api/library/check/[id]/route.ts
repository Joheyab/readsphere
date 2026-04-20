import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ exists: false })

  const { data } = await supabase
    .from("user_library")
    .select("id, rating") // 👈
    .eq("user_id", user.id)
    .eq("book_id", id)
    .single()
  return NextResponse.json({ exists: !!data, entry: data ?? null })
}
