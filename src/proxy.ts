import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Exclude all of _next/* (not just _next/static|_next/image) -- this
    // must also cover the dev-only HMR websocket endpoint (_next/hmr),
    // which this middleware was otherwise intercepting and breaking.
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
