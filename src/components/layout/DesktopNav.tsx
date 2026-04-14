"use client"

import Link from "next/link"
import LogoutButton from "../auth/LogoutButton"
import { useProfile } from "@/context/ProfileContext";
const DesktopNav = () => {
  const { profile } = useProfile()

  return (
    <aside className="hidden lg:flex h-screen w-72 shrink-0 border-r border-zinc-800 bg-zinc-900 p-6 flex-col">
      <div>
        <div className="mb-10 flex flex-col items-center ">
          <h1 className="text-2xl font-bold">📚 ReadSphere</h1>
          <p className="mt-2 text-sm text-zinc-400">Tu biblioteca social</p>
          <div className="relative h-20 w-20 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
            {profile?.avatar_url ? (
              <div>
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-fill"
                />
              </div>
            ) : (
              <span className="text-zinc-400 text-sm font-medium">
                {profile?.username?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
        </div>

        <nav className="space-y-3">
          <Link
            href="/"
            className="block rounded-xl px-4 py-3 transition hover:bg-zinc-800"
          >
            Home
          </Link>
          <Link
            href="/library"
            className="block rounded-xl px-4 py-3 transition hover:bg-zinc-800"
          >
            Mi biblioteca
          </Link>
          <Link
            href="/dashboard"
            className="block rounded-xl px-4 py-3 transition hover:bg-zinc-800"
          >
            Dashboard
          </Link>
        </nav>
      </div>

      {/* Logout al fondo */}
      <div className="mt-auto pt-6">
        <LogoutButton />
      </div>
    </aside>
  )
}

export default DesktopNav
