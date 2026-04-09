import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES    = ['/login', '/register', '/forgot-password', '/verify-email', '/auth/callback', '/auth/oauth-callback', '/organisations/invite'];
const AUTH_ONLY_ROUTES = ['/login', '/register'];
const ADMIN_ROUTES     = ['/admin'];

interface JwtPayload {
  roles: string[];
}

async function verifyToken(token: string): Promise<JwtPayload | null> {
  const secret = process.env.JWT_SECRET;
  console.log("🔍 [Middleware] Verifying token - Secret exists:", !!secret);
  if (!secret) {
    console.log("❌ [Middleware] JWT_SECRET not set");
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    console.log("✅ [Middleware] Token verified successfully");
    return payload as unknown as JwtPayload;
  } catch (e) {
    console.error("❌ [Middleware] Token verification failed:", (e as any).message);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const token = request.cookies.get('token')?.value;

  console.log("🔍 [Middleware] Path:", pathname, "IsPublic:", isPublic, "Token:", token ? "exists" : "missing");
  const payload = token ? await verifyToken(token) : null;
  const validToken = payload !== null;
  console.log("🔍 [Middleware] ValidToken:", validToken);

  if (!isPublic && !validToken) {
    console.log("⛔ [Middleware] Not public and no valid token - redirecting to login");
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.set('token', '', { maxAge: 0, path: '/' });
    return response;
  }

  const isAuthOnly = AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthOnly && validToken) {
    console.log("⛔ [Middleware] Auth-only route and valid token - redirecting to home");
    return NextResponse.redirect(new URL('/', request.url));
  }

  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  if (isAdminRoute && validToken) {
    const roles = (payload as any)?.roles || [];
    if (!roles.includes('platform_admin')) {
      console.log("⛔ [Middleware] Admin route but not admin - redirecting to home");
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  console.log("✅ [Middleware] Allowing request to proceed");
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.svg|images).*)'],
};
