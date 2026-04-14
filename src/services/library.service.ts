// services/library/service.ts
import { createClient } from "@/lib/supabase/server";

export async function getUserLibrary(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_library")
    .select(`
      id,
      status,
      rating,
      progress_percent,
      books (
        id,
        title,
        pages,
        cover_url,
        authors ( name ),
        book_genres (
          genres ( name )
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function updateLibraryEntry(entryId: string, userId: string, payload: {
  status: string;
  purchase_place: string | null;
  start_date: string | null;
  finish_date: string | null;
  progress_percent: number;
  rating: number | null;
  purchase_price: number | null;
  format: string | null;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_library")
    .update(payload)
    .eq("id", entryId)
    .eq("user_id", userId);
     console.log("updateLibraryEntry error:", error);

  if (error) throw new Error(error.message);
}

export async function deleteLibraryEntry(entryId: string, userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_library")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}