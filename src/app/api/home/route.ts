import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const firstDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString()

  // Libros leídos
  const { count: booksFinished } = await supabase
    .from("user_library")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "finished")

  // Páginas este mes (libros actualizados este mes)
  const { data: thisMonth } = await supabase
    .from("user_library")
    .select("status, current_page, books(pages)")
    .eq("user_id", user.id)
    .in("status", ["finished", "reading"])
    .gte("updated_at", firstDayOfMonth)

  const pagesThisMonth =
    thisMonth?.reduce((acc, entry) => {
      const pages =
        entry.status === "finished"
          ? ((entry.books as unknown as { pages: number })?.pages ?? 0)
          : (entry.current_page ?? 0)
      return acc + pages
    }, 0) ?? 0

  // Lecturas recientes (leyendo o recién terminados)
  const { data: recent } = await supabase
    .from("user_library")
    .select(
      `
      id,
      status,
      progress_percent,
      books ( title, authors ( name ) )
    `,
    )
    .eq("user_id", user.id)
    .in("status", ["reading", "finished"])
    .order("updated_at", { ascending: false })
    .limit(6)

  return NextResponse.json({
    booksFinished: booksFinished ?? 0,
    pagesThisMonth,
    recent: recent ?? [],
  })
}
