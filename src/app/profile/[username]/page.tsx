"use client";

import { useParams } from "next/navigation";
import { useProfile } from "@/context/ProfileContext";
import OwnProfile from "@/components/profile/OwnProfile";
import PublicProfile from "@/components/profile/PublicProfile";

export default function ProfilePage() {
  const { username } = useParams();
  const { profile } = useProfile();

  const isOwnProfile = profile?.username === username;

  if (isOwnProfile) {
    return <OwnProfile />;
  }

  return <PublicProfile username={username as string} />;
}