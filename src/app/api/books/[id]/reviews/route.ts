import { createClient } from "@/lib/supabase/server";
import { getBookReviews, createReview } from "@/services/reviews.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await getBookReviews(id);
    return NextResponse.json(data);
  } catch (error){
    return NextResponse.json({ error: "Error al obtener reseñas" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rating, content } = await request.json();

  try {
    await createReview(user.id, id, rating, content);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al crear reseña" }, { status: 500 });
  }
}