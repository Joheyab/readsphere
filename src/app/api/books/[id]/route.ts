import { getBookById } from "@/services/books.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await getBookById(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 });
  }
}