"use client"

import { usePathname } from "next/navigation"
import DesktopNav from "./DesktopNav"
import MobileNav from "./MobileNav"
import Banner from "./Banner"

const NO_CHROME_PREFIXES = ["/auth", "/forgot-password"]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideChrome = NO_CHROME_PREFIXES.some((p) => pathname?.startsWith(p))

  if (hideChrome) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <div className="flex h-screen">
      <DesktopNav />
      <div className="flex-1 flex flex-col">
        <Banner />
        <div className="border-b border-app bg-card px-4 py-4 lg:hidden">
          <MobileNav />
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-10">{children}</main>
      </div>
    </div>
  )
}