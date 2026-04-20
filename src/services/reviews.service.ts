import { createClient } from "@/lib/supabase/server"

export async function getBookReviews(bookId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
    id,
    rating,
    content,
    created_at,
    profiles!reviews_user_id_fkey ( username, avatar_url )
  `,
    )
    .eq("book_id", bookId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createReview(
  userId: string,
  bookId: string,
  rating: number,
  content: string,
) {
  const supabase = await createClient()

  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: userId,
      book_id: bookId,
      rating,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,book_id" },
  )

  if (error) throw new Error(error.message)
}

export async function updateReviewRating(userId: string, bookId: string, rating: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("reviews")
    .update({ rating, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("book_id", bookId);

  if (error) throw new Error(error.message);
}