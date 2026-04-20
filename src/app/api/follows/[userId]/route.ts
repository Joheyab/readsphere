import { createClient } from "@/lib/supabase/server";
import { followUser, unfollowUser, getFollowStats, isFollowing } from "@/services/follows.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const stats = await getFollowStats(userId);
  const following = user ? await isFollowing(user.id, userId) : false;

  return NextResponse.json({ ...stats, isFollowing: following });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await followUser(user.id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al seguir" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await unfollowUser(user.id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al dejar de seguir" }, { status: 500 });
  }
}