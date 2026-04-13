import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 🔐 rutas privadas
  const protectedRoutes = ["/library", "/dashboard", "/profile", "/onboarding"]

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  )

  // 🚫 sin sesión
  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // 👤 validar perfil
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single()

    const isOnboarding = pathname.startsWith("/onboarding")
    const isAuthRoute = pathname.startsWith("/auth")

    // si ya tiene username y entra a onboarding o auth
    if (profile?.username && (isOnboarding || isAuthRoute)) {
      return NextResponse.redirect(new URL("/library", request.url))
    }

    // si no tiene username y no está en onboarding
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
