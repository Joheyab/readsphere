import { createServerClient } from "@supabase/ssr"
import createIntlMiddleware from "next-intl/middleware"
import { NextResponse, type NextRequest } from "next/server"

const intlMiddleware = createIntlMiddleware({
  locales: ["en", "es"],
  defaultLocale: "es",
  localePrefix: "never",
})

export async function middleware(request: NextRequest) {
  // Primero corre el middleware de intl
  const intlResponse = intlMiddleware(request)

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Copia las cookies del intlResponse al response
  intlResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    response.cookies.set(name, value, options)
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const protectedRoutes = ["/library", "/dashboard", "/profile", "/onboarding"]
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single()

    const isOnboarding = pathname.startsWith("/onboarding")
    const isAuthRoute = pathname.startsWith("/auth")

    if (profile?.username && (isOnboarding || isAuthRoute)) {
      return NextResponse.redirect(new URL("/library", request.url))
    }

    if (!profile?.username && !isOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/library/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/auth/:path*",
  ],
}