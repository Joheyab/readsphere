import AppShell from "@/components/layout/AppShell"
import { ProfileProvider } from "@/context/ProfileContext"
import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import "./globals.css"

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
}: Readonly<{ children: React.ReactNode }>) {
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
              <AppShell>{children}</AppShell>
            </ProfileProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
