import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    // Retrieve the access token from cookies
    const accessToken = req.cookies.get("accessToken");

    // List of protected routes
    const protectedRoutes = ["/dashboard"];

    // If the user tries to access a protected route without a token, redirect them
    if (protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route)) && !accessToken) {
        return NextResponse.redirect(new URL("/login", req.url)); // Redirect to login page
    }

    return NextResponse.next(); // Allow access
}

// Apply middleware only to protected routes
export const config = {
    matcher: ["/dashboard/:path*"], // Protect specific routes
};
