"use client"

import { useProfile } from "@/context/ProfileContext"
import Link from "next/link"
import LogoutButton from "../auth/LogoutButton"
import ThemeLanguageToggle from "./ThemeLanguageToggle"
import { useTranslations } from "next-intl"

const DesktopNav = () => {
  const { profile } = useProfile()
  const t = useTranslations("nav")

  return (
    <aside className="hidden lg:flex h-screen w-72 shrink-0 border-r border-app bg-card p-6 flex-col">
      <div>
        <div className="mb-10 flex flex-col items-center ">
          <h1 className="text-2xl font-bold">📚 ReadSphere</h1>

          <p className="mt-2 text-sm text-secondary">
            {t("tagline")}
          </p>

          <div className="relative h-20 w-20 rounded-full overflow-hidden bg-input border border-zinc-700 flex items-center justify-center shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-fill"
              />
            ) : (
              <span className="text-secondary text-sm font-medium">
                {profile?.username?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
        </div>

        <nav className="space-y-3">
          <Link
            href="/"
            className="block rounded-xl px-4 py-3 transition hover:bg-input"
          >
            {t("home")}
          </Link>

          <Link
            href="/library"
            className="block rounded-xl px-4 py-3 transition hover:bg-input"
          >
            {t("library")}
          </Link>

          <Link
            href={`/profile/${profile?.username}`}
            className="block rounded-xl px-4 py-3 transition hover:bg-input"
          >
            {t("profile")}
          </Link>
        </nav>
      </div>

      <div className="mt-auto pt-6 flex gap-2 flex-col">
        <ThemeLanguageToggle />
        <LogoutButton />
      </div>
    </aside>
  )
}

export default DesktopNav