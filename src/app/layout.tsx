import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

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
      <body className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="hidden w-72 border-r border-zinc-800 bg-zinc-900 p-6 lg:block">
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
          </aside>

          {/* Main content */}
          <main className="flex-1 p-6 lg:p-10">{children}</main>
        </div>
      </body>
    </html>
  );
}

