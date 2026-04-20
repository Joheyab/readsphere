import { getPublicProfile } from "@/services/profile.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const data = await getPublicProfile(username);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }
}