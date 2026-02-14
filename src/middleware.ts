import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Redirect root to dashboard
    if (request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // All routes are accessible — no auth checks
    return NextResponse.next();
}

export const config = {
    matcher: ['/'],
};
