import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Portal role definitions
type PortalRole = 'admin' | 'dispatcher' | 'driver' | 'customer';

const ROLE_DASHBOARDS: Record<PortalRole, string> = {
  admin: '/admin',
  dispatcher: '/dispatcher',
  driver: '/driver',
  customer: '/customer',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Staff alias redirect: /staff and /staff/* -> /dispatcher and /dispatcher/*
  if (pathname === '/staff' || pathname.startsWith('/staff/')) {
    const target = pathname === '/staff' ? '/dispatcher' : pathname.replace('/staff', '/dispatcher');
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url);
  }

  // Determine if this is a protected portal route
  const isCustomerRoute = pathname === '/customer' || pathname.startsWith('/customer/');
  const isDriverRoute = pathname === '/driver' || pathname.startsWith('/driver/');
  const isDispatcherRoute = pathname === '/dispatcher' || pathname.startsWith('/dispatcher/');
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isProtectedPortal = isCustomerRoute || isDriverRoute || isDispatcherRoute || isAdminRoute;

  // Read auth tokens/cookies
  const roleCookie = request.cookies.get('aht_role')?.value as PortalRole | undefined;
  
  // Check for Supabase session cookie (standard prefixes: sb-*-auth-token or aht_auth)
  const hasSupabaseCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  // 2. Handle unauthenticated access to protected portal routes
  if (isProtectedPortal) {
    if (!roleCookie && !hasSupabaseCookie) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = '/sign-in';
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // If role cookie is present, enforce strict portal boundaries
    if (roleCookie) {
      let isAllowed = false;
      if (isAdminRoute && roleCookie === 'admin') isAllowed = true;
      if (isDispatcherRoute && roleCookie === 'dispatcher') isAllowed = true;
      if (isDriverRoute && roleCookie === 'driver') isAllowed = true;
      if (isCustomerRoute && roleCookie === 'customer') isAllowed = true;

      if (!isAllowed) {
        // Redirect unauthorized role to their dedicated dashboard
        const authorizedDashboard = ROLE_DASHBOARDS[roleCookie] || '/customer';
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = authorizedDashboard;
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // 3. If authenticated user visits sign-in or sign-up, redirect to their dashboard
  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up';
  if (isAuthPage && roleCookie && ROLE_DASHBOARDS[roleCookie]) {
    // Check if redirect query param exists and is valid for their role
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const roleDashboard = ROLE_DASHBOARDS[roleCookie];
    
    let target = roleDashboard;
    if (redirectParam && redirectParam.startsWith(roleDashboard)) {
      target = redirectParam;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = target;
    redirectUrl.searchParams.delete('redirect');
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
