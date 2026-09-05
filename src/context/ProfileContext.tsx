"use client"

import { supabase } from "@/lib/supabase/client"
import { usePathname, useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"

type Profile = {
  avatar_url: string | null
  username: string | null
  bio: string | null
  favorite_genres: string[] | null
  id: string
}

type ProfileContextType = {
  profile: Profile | null
}

const ProfileContext = createContext<ProfileContextType>({ profile: null })

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    async function fetchProfile(userId: string) {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, username, bio, favorite_genres,id")
        .eq("id", userId)
        .single()

      if (!error && data && mounted) setProfile(data)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && mounted) fetchProfile(session.user.id)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else if (mounted) {
        setProfile(null)
        // Session gone (expired/signed out) — bounce to login unless already on an auth page
        if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          if (!pathname?.startsWith("/auth")) {
            router.push("/auth/login")
          }
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  return (
    <ProfileContext.Provider value={{ profile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
