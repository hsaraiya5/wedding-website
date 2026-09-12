import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session cookie on every request. Required so
// that sessions established in Server Actions / Route Handlers stay valid
// across subsequent navigations. See middleware.ts at the project root.
//
// Uses getSession() (reads/refreshes the local cookie) rather than
// getUser() (re-validates against Supabase's server every request). That
// trades away re-validating identity on every single navigation for
// removing a ~250-700ms network round-trip per request -- a deliberate
// call for this project (see Decision Log): a tampered/expired token still
// can't read or write anything it shouldn't, since RLS enforces that
// independently of what middleware trusted. Route handlers/Server Actions
// that do sensitive writes (e.g. admin actions) still get real enforcement
// from Postgres, not from this cookie check.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touching getSession() is what actually triggers the cookie refresh.
  await supabase.auth.getSession();

  return supabaseResponse;
}
