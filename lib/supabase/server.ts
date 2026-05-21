import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Get the Descope JWT token from cookies
 */
async function getDescopeToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    // Descope session token cookie
    const sessionToken = cookieStore.get("DS")?.value ||
                        cookieStore.get("DSR")?.value;
    return sessionToken || null;
  } catch (error) {
    console.error("Error getting Descope token:", error);
    return null;
  }
}

export async function createClient() {
  const cookieStore = await cookies();
  const descopeToken = await getDescopeToken();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
      global: {
        headers: descopeToken
          ? {
              // Pass Descope JWT directly - Supabase validates it via third-party auth config
              Authorization: `Bearer ${descopeToken}`,
            }
          : {},
      },
    },
  );
}
