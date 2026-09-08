import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth/auth";

export default auth((req) => {
  if (req.auth) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/sign-in", req.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);

  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|$).*)",
  ],
};
