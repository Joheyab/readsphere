"use client"

import { supabase } from "@/lib/supabase/client"
import { UserLibraryEntry } from "@/types/library"
import { useCallback, useEffect, useState } from "react"

export function useLibrary() {
  const [entries, setEntries] = useState<UserLibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const fetchLibrary = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from("user_library")
        .select(
          `
          id,
          status,
          rating,
          progress_percent,
          books (
            id,
            title,
            cover_url,
            authors ( name )
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setEntries(data as unknown as UserLibraryEntry[])
      }

      setLoading(false)
    }

    fetchLibrary()
  }, [refresh])

  const refetch = useCallback(() => setRefresh((r) => r + 1), [])

  return {
    entries,
    loading,
    refetch,
  }
}
