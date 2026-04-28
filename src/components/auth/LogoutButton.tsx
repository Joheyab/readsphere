"use client"

import { supabase } from "@/lib/supabase/client"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()
  const t = useTranslations("nav") 
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full rounded-xl bg-input px-4 py-3 text-sm hover:bg-zinc-700 transition"
    >
      {t("logout")}
    </button>
  )
}
