import { createClient } from "@/lib/supabase/server"

export async function checkAndUnlockAchievements(userId: string) {
  const supabase = await createClient()

  // 🔓 Ya desbloqueados
  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId)

  const unlockedIds = new Set(unlocked?.map((u) => u.achievement_id) ?? [])

  // 🏆 Todos los achievements
  const { data: achievements } = await supabase
    .from("achievements")
    .select("id, code")

  if (!achievements) return []

  // 📚 Total libros
  const { count: totalBooks } = await supabase
    .from("user_library")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  // 📖 Terminados
  const { count: finishedBooks } = await supabase
    .from("user_library")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "finished")

  // 📚 Wishlist
  const { count: wishlistCount } = await supabase
    .from("user_library")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "wishlist")

  // ⭐ Favoritos
  const { count: favoritesCount } = await supabase
    .from("user_library")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_favorite", true)

  // 📝 Reviews
  const { count: reviewsCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  // ⭐ Ratings
  const { count: ratingsCount } = await supabase
    .from("ratings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  // 📤 Shares (si tienes tabla)
  const { count: sharesCount } = await supabase
    .from("shares")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  // 📖 Libros completos con info
  const { data: booksData } = await supabase
    .from("user_library")
    .select("created_at, finished_at, books(page_count, author_id, series_id)")
    .eq("user_id", userId)
    .eq("status", "finished")

  const books = booksData ?? []

  // 🌎 Géneros
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

  // 📊 Cálculos avanzados
  const hasReadLongBook = books.some((b: any) => b.books?.page_count > 500)

  const shortBooksCount = books.filter(
    (b: any) => (b.books?.page_count ?? 0) < 200,
  ).length

  const authorsMap: Record<string, number> = {}
  const seriesMap: Record<string, number> = {}

  books.forEach((b: any) => {
    const author = b.books?.author_id
    const series = b.books?.series_id

    if (author) authorsMap[author] = (authorsMap[author] ?? 0) + 1
    if (series) seriesMap[series] = (seriesMap[series] ?? 0) + 1
  })

  const sameAuthorCount = Math.max(0, ...Object.values(authorsMap))
  const seriesReadCount = Math.max(0, ...Object.values(seriesMap))

  const newAuthorsCount = Object.keys(authorsMap).length

  // ⏱️ Lectura en 1 día
  const finishedInOneDay = books.some((b: any) => {
    if (!b.created_at || !b.finished_at) return false
    const diff =
      new Date(b.finished_at).getTime() -
      new Date(b.created_at).getTime()
    return diff <= 1000 * 60 * 60 * 24
  })

  // 🕒 Horarios (simplificado)
  const hasReadAtNight = books.some((b: any) => {
    const hour = new Date(b.finished_at).getHours()
    return hour >= 0 && hour <= 4
  })

  const hasReadEarly = books.some((b: any) => {
    const hour = new Date(b.finished_at).getHours()
    return hour >= 5 && hour <= 7
  })

  const hasWeekendActivity = books.some((b: any) => {
    const day = new Date(b.finished_at).getDay()
    return day === 0 || day === 6
  })

  // 👤 Perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, username, bio")
    .eq("id", userId)
    .single()

  const isProfileComplete =
    !!profile?.username && !!profile?.bio && !!profile?.avatar_url

  // 🔥 CONDICIONES
  const conditions: Record<string, boolean> = {
    // Básicos
    first_book: (totalBooks ?? 0) >= 1,
    first_finish: (finishedBooks ?? 0) >= 1,
    read_5: (finishedBooks ?? 0) >= 5,
    read_10: (finishedBooks ?? 0) >= 10,
    read_50: (finishedBooks ?? 0) >= 50,
    read_100: (finishedBooks ?? 0) >= 100,

    // Biblioteca
    add_10_books: (totalBooks ?? 0) >= 10,
    add_50_books: (totalBooks ?? 0) >= 50,
    wishlist_10: (wishlistCount ?? 0) >= 10,

    // Géneros
    genres_3: uniqueGenres.size >= 3,
    genres_5: uniqueGenres.size >= 5,

    // Interacción
    favorites_5: (favoritesCount ?? 0) >= 5,
    rating_10: (ratingsCount ?? 0) >= 10,
    review_1: (reviewsCount ?? 0) >= 1,
    review_10: (reviewsCount ?? 0) >= 10,
    first_share: (sharesCount ?? 0) >= 1,

    // Perfil
    profile_complete: isProfileComplete,
    avatar_set: !!profile?.avatar_url,

    // Lectura avanzada
    long_book: hasReadLongBook,
    short_books_5: shortBooksCount >= 5,
    series_3: seriesReadCount >= 3,
    author_5: sameAuthorCount >= 5,
    discover_new_author: newAuthorsCount >= 1,

    // Tiempo
    read_1_day: finishedInOneDay,
    night_reader: hasReadAtNight,
    early_reader: hasReadEarly,
    weekend_reader: hasWeekendActivity,
  }

  // 🎯 Filtrar logros a desbloquear
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
      achievements ( id, code )
    `,
    )
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data
}