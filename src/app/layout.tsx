import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import MobileNav from "@/components/layout/MobileNav";
import DesktopNav from "@/components/layout/DesktopNav";

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
          <DesktopNav />

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