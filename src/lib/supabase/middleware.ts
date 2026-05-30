import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
    error: getUserError
  } = await supabase.auth.getUser()

  if (getUserError) {
    console.error('Middleware getUser error:', getUserError.message)
  }

  // Protected routes logic
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isPublicRoute = request.nextUrl.pathname === '/' || isAuthRoute
  const isProtectedRoute = !isPublicRoute

  if (!user && isProtectedRoute) {
    console.log(`Middleware: Unauthorized access to ${request.nextUrl.pathname}. Redirecting to /auth/login`)
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    const redirectResponse = NextResponse.redirect(url)
    
    // Crucial: copy cookies from supabaseResponse to redirectResponse
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    
    return redirectResponse
  }

  // If user is logged in, restrict access to auth pages
  if (user && isAuthRoute) {
    console.log(`Middleware: Authenticated user ${user.id} tried to access auth route ${request.nextUrl.pathname}. Redirecting to /dashboard`)
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirectResponse = NextResponse.redirect(url)
    
    // Crucial: copy cookies from supabaseResponse to redirectResponse
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    
    return redirectResponse
  }

  return supabaseResponse
}
