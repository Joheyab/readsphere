import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import MobileNav from "@/components/layout/MobileNav";

export const metadata: Metadata = {
  title: "ReadSphere",
  description: "Tu biblioteca personal + red social de lectores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="h-screen overflow-hidden bg-zinc-950 text-white">
        <div className="flex h-screen">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex h-screen w-72 shrink-0 border-r border-zinc-800 bg-zinc-900 p-6 flex-col">
            <div>
              <div className="mb-10">
                <h1 className="text-2xl font-bold">📚 ReadSphere</h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Tu biblioteca social
                </p>
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

          <div className="flex-1 flex flex-col">
            {/* Mobile top nav */}
            <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-4 lg:hidden">
              <MobileNav />
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}