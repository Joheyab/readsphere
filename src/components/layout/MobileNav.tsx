"use client";

import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";

export default function MobileNav() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">📚 ReadSphere</h1>
      </div>

      <nav className="flex items-center gap-2 overflow-x-auto">
        <Link href="/" className="rounded-lg bg-zinc-800 px-3 py-2 text-sm">
          Home
        </Link>
        <Link
          href="/library"
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm"
        >
          Biblioteca
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm"
        >
          Dashboard
        </Link>
      </nav>

      <LogoutButton />
    </div>
  );
}