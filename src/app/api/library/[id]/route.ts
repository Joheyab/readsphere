import { createClient } from "@/lib/supabase/server";
import { deleteLibraryEntry, updateLibraryEntry } from "@/services/library.service";
import { updateReviewRating } from "@/services/reviews.service";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json();

  try {
    await updateLibraryEntry(id, user.id, payload);
     // Si el payload incluye rating, actualizar también la reseña
    if (payload.rating) {
      const { data: entry } = await supabase
        .from("user_library")
        .select("book_id")
        .eq("id", id)
        .single();

      if (entry?.book_id) {
        await updateReviewRating(user.id, entry.book_id, payload.rating);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await deleteLibraryEntry(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}