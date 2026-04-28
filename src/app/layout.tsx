import DesktopNav from "@/components/layout/DesktopNav"
import MobileNav from "@/components/layout/MobileNav"
import { ProfileProvider } from "@/context/ProfileContext"
import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import "./globals.css"
import Banner from "@/components/layout/Banner"

export const metadata: Metadata = {
  title: "ReadSphere",
  description: "Tu biblioteca personal + red social de lectores",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="h-screen overflow-hidden bg-app text-app">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
          >
            <ProfileProvider>
              <Toaster theme="dark" position="top-right" />
              <div className="flex h-screen">
                {/* Desktop Sidebar */}
                <DesktopNav />

                <div className="flex-1 flex flex-col">
                <Banner />
                  {/* Mobile top nav */}
                  <div className="border-b border-app bg-card px-4 py-4 lg:hidden">
                    <MobileNav />
                  </div>

                  {/* Main content */}
                  <main className="flex-1 overflow-y-auto p-4 lg:p-10">
                    {children}
                  </main>
                </div>
              </div>
            </ProfileProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
