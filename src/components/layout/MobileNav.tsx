"use client"

import { useProfile } from "@/hooks/useProfile"
import Link from "next/link"
import { useState } from "react"
import LogoutButton from "../auth/LogoutButton"

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const { profile } = useProfile()

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        {/* Avatar trigger */}
        <div
          onClick={() => setOpen(true)}
          className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-full h-full object-fill"
            />
          ) : (
            <span className="text-zinc-400 text-sm font-medium">
              {profile?.username?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>

        <h1 className="text-lg font-bold">📚 ReadSphere</h1>

        {/* Spacer para centrar el título */}
        <div className="w-9" />
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col p-6 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Profile header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-fill"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-zinc-400 text-sm font-medium">
                  {profile?.username?.[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">
              @{profile?.username ?? "..."}
            </p>
            <p className="text-zinc-500 text-xs">Ver perfil</p>
          </div>
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="ml-auto text-zinc-500 hover:text-white transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="space-y-1 flex-1">
          {[
            { href: "/", label: "🏠 Home" },
            { href: "/library", label: "📚 Mi biblioteca" },
            { href: "/dashboard", label: "📊 Dashboard" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="pt-6 border-t border-zinc-800">
          <LogoutButton />
        </div>
      </div>
    </>
  )
}
