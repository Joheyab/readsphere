import { createClient } from "@/lib/supabase/server";

export async function followUser(followerId: string, followingId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });
  if (error) throw new Error(error.message);
}

export async function unfollowUser(followerId: string, followingId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw new Error(error.message);
}

export async function getFollowStats(userId: string) {
  const supabase = await createClient();

  const { count: followers } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  const { count: following } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);

  return { followers: followers ?? 0, following: following ?? 0 };
}

export async function isFollowing(followerId: string, followingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();
  return !!data;
}