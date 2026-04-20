import { createClient } from "@/lib/supabase/server";

export async function getFeed(userId: string) {
  const supabase = await createClient();

  // Perfil del usuario (géneros favoritos)
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("favorite_genres")
    .eq("id", userId)
    .single();

  const favoriteGenres = userProfile?.favorite_genres ?? [];

  // IDs de usuarios que sigo
  const { data: followingData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followingIds = followingData?.map((f) => f.following_id) ?? [];
  const excludeIds = [...followingIds, userId];

  // 1. Reseñas de seguidos
  const { data: followingReviews } = await supabase
    .from("reviews")
    .select(`
      id, rating, content, created_at,
      profiles!reviews_user_id_fkey ( id, username, avatar_url ),
      books ( id, title, cover_url, authors ( name ) )
    `)
    .in("user_id", followingIds.length > 0 ? followingIds : ["none"])
    .order("created_at", { ascending: false })
    .limit(5);

  // 2. Reseñas aleatorias de otros
  const { data: randomReviews } = await supabase
    .from("reviews")
    .select(`
      id, rating, content, created_at,
      profiles!reviews_user_id_fkey ( id, username, avatar_url ),
      books ( id, title, cover_url, authors ( name ) )
    `)
    .not("user_id", "in", `(${excludeIds.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(5);

  // 3. Libros recomendados por género que no tengo en mi biblioteca
  const { data: myBooks } = await supabase
    .from("user_library")
    .select("book_id")
    .eq("user_id", userId);

  const myBookIds = myBooks?.map((b) => b.book_id) ?? [];

  let recommendedBooks: any[] = [];
  if (favoriteGenres.length > 0) {
    const { data: genreIds } = await supabase
      .from("genres")
      .select("id")
      .in("name", favoriteGenres);

    const genreIdList = genreIds?.map((g) => g.id) ?? [];

    if (genreIdList.length > 0) {
      const { data: booksByGenre } = await supabase
        .from("book_genres")
        .select("book_id, books ( id, title, cover_url, authors ( name ), book_genres ( genres ( name ) ) )")
        .in("genre_id", genreIdList)
        .not("book_id", "in", myBookIds.length > 0 ? `(${myBookIds.join(",")})` : `('none')`)
        .limit(5);

      recommendedBooks = booksByGenre ?? [];
    }
  }

  // 4. Personas con gustos similares que no sigo
  let suggestedPeople: any[] = [];
  if (favoriteGenres.length > 0) {
    const { data: similarUsers } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, favorite_genres")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .overlaps("favorite_genres", favoriteGenres)
      .limit(3);

    suggestedPeople = similarUsers ?? [];
  }

  // 5. Actividad de seguidos (libros agregados recientemente)
  const { data: followingActivity } = await supabase
    .from("user_library")
    .select(`
      id, status, created_at,
      profiles!user_library_user_id_fkey ( id, full_name, username, avatar_url ),
      books ( id, title, cover_url, authors ( name ) )
    `)
    .in("user_id", followingIds.length > 0 ? followingIds : ["none"])
    .order("created_at", { ascending: false })
    .limit(5);

  // Mezclar todo en un feed
  const feed = [
    ...(followingReviews ?? []).map((r) => ({ type: "review", isFollowing: true, data: r })),
    ...(randomReviews ?? []).map((r) => ({ type: "review", isFollowing: false, data: r })),
    ...(recommendedBooks ?? []).map((b) => ({ type: "book", data: b.books })),
    ...(suggestedPeople ?? []).map((p) => ({ type: "person", data: p })),
    ...(followingActivity ?? []).map((a) => ({ type: "activity", data: a })),
  ].sort(() => Math.random() - 0.5); // mezcla aleatoria

  return feed;
}