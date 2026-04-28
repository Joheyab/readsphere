import { createClient } from "@/lib/supabase/server";

export async function getBookById(bookId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select(`
      id,
      title,
      description_en,
      description_es,
      isbn,
      cover_url,
      pages,
      published_year,
      authors ( name, bio ),
      book_genres ( genres ( id, name ) )
    `)
    .eq("id", bookId)
    .single();
    

  if (error) throw new Error(error.message);
  return data;
}