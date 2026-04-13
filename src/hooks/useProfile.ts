"use client"

import { supabase } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

type Profile = {
  avatar_url: string | null
  username: string | null
  bio: string | null
  favorite_genres: string[] | null
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchProfile(userId: string) {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, username, bio, favorite_genres")
        .eq("id", userId)
        .single()

      if (!error && data && mounted) {
        setProfile(data)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && mounted) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          if (mounted) setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { profile }
}
