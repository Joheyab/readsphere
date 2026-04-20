import { createClient } from "@/lib/supabase/server";
import { getFollowStats } from "./follows.service";

export async function getPublicProfile(username: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name,username, bio, avatar_url, favorite_genres")
    .eq("username", username)
    .single();

  if (error || !profile) throw new Error("Perfil no encontrado");

   const followStats = await getFollowStats(profile.id);
  // Stats
  const { count: booksFinished } = await supabase
    .from("user_library")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("status", "finished");

  const { count: booksReading } = await supabase
    .from("user_library")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("status", "reading");

  // Biblioteca pública
  const { data: library } = await supabase
    .from("user_library")
    .select(`
      id,
      status,
      rating,
      progress_percent,
      books (
        id,
        title,
        cover_url,
        authors ( name )
      )
    `)
    .eq("user_id", profile.id)
    .eq("is_private", false)
    .order("created_at", { ascending: false });

  // Reseñas
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      content,
      created_at,
      books ( id, title, cover_url )
    `)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  // Logros
  const { data: achievements } = await supabase
    .from("user_achievements")
    .select(`
      unlocked_at,
      achievements ( code, title, description )
    `)
    .eq("user_id", profile.id)
    .order("unlocked_at", { ascending: false });

  return {
    profile,
    stats: {
      booksFinished: booksFinished ?? 0,
      booksReading: booksReading ?? 0,
      followers: followStats.followers,
      following: followStats.following,
    },
    library: library ?? [],
    reviews: reviews ?? [],
    achievements: achievements ?? [],
  };
}