"use client"

import { fetchWithAuth } from "@/lib/supabase/fetchWithAuth"
import { UserLibraryEntry } from "@/types/library"
import { useCallback, useEffect, useState } from "react"

export function useLibrary() {
  const [entries, setEntries] = useState<UserLibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const fetchLibrary = async () => {
      setLoading(true)

      const res = await fetchWithAuth("/api/library")
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
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
