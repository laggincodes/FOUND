import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    supabaseUrl.trim().length > 0
  );

  let supabaseResponse = NextResponse.next({
    request,
  });

  // If Supabase is not configured yet, allow normal navigation for hackathon demo fallback
  if (!isConfigured) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do NOT run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected application routes
  const isProtectedPath = [
    '/pantry',
    '/inventory',
    '/add',
    '/scan',
    '/priority',
    '/recipes',
    '/grocery',
    '/impact',
    '/profile',
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // Auth pages (login, signup, forgot-password)
  const isAuthPath = [
    '/login',
    '/signup',
    '/forgot-password',
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // If user is not authenticated and trying to access protected route -> redirect to /login
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access login/signup -> redirect to home
  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    url.pathname = redirectTo || '/';
    url.searchParams.delete('redirectTo');
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
