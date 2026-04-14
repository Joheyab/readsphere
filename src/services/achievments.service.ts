import { createClient } from "@/lib/supabase/server"

export async function checkAndUnlockAchievements(userId: string) {
  const supabase = await createClient()

  // Traer achievements ya desbloqueados
  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId)

  const unlockedIds = new Set(unlocked?.map((u) => u.achievement_id) ?? [])

  // Traer todos los achievements
  const { data: achievements } = await supabase
    .from("achievements")
    .select("id, code, title, description")

  if (!achievements) return

  // Traer stats del usuario
  const { count: totalBooks } = await supabase
    .from("user_library")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  const { count: finishedBooks } = await supabase
    .from("user_library")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "finished")

  // Géneros distintos leídos
  const { data: genresData } = await supabase
    .from("user_library")
    .select("books(book_genres(genre_id))")
    .eq("user_id", userId)
    .eq("status", "finished")

  const uniqueGenres = new Set(
    genresData?.flatMap(
      (e) => (e.books as any)?.book_genres?.map((g: any) => g.genre_id) ?? [],
    ),
  )

  // Condiciones por código
  const conditions: Record<string, boolean> = {
    first_book: (totalBooks ?? 0) >= 1,
    first_finish: (finishedBooks ?? 0) >= 1,
    read_5: (finishedBooks ?? 0) >= 5,
    read_10: (finishedBooks ?? 0) >= 10,
    read_50: (finishedBooks ?? 0) >= 50,
    genres_3: uniqueGenres.size >= 3,
    genres_5: uniqueGenres.size >= 5,
  }

  // Desbloquear los que se cumplen y no están desbloqueados aún
  const toUnlock = achievements.filter(
    (a) => conditions[a.code] && !unlockedIds.has(a.id),
  )

  if (toUnlock.length > 0) {
    await supabase.from("user_achievements").insert(
      toUnlock.map((a) => ({
        user_id: userId,
        achievement_id: a.id,
        unlocked_at: new Date().toISOString(),
      })),
    )
  }

  return toUnlock
}

export async function getUserAchievements(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_achievements")
    .select(
      `
      unlocked_at,
      achievements ( id, code, title, description )
    `,
    )
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data
}
