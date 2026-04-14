import { createClient } from "@/lib/supabase/server";
import { checkAndUnlockAchievements } from "@/services/achievments.service";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const newAchievements = await checkAndUnlockAchievements(user.id);
  return NextResponse.json({ unlocked: newAchievements ?? [] });
}