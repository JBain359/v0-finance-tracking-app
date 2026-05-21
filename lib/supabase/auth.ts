import { cookies } from "next/headers";

/**
 * Get the Descope user ID from the session token
 * The Descope JWT contains the user ID in the 'sub' claim
 */
export async function getDescopeUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();

    // Descope stores the session token in a cookie
    // The cookie name depends on your Descope project configuration
    const sessionToken =
      cookieStore.get("DS")?.value || cookieStore.get("DSR")?.value;

    if (!sessionToken) {
      return null;
    }

    // Decode the JWT to get the user ID (sub claim)
    // JWT format: header.payload.signature
    const parts = sessionToken.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );

    return payload.sub || null;
  } catch (error) {
    console.error("Error getting Descope user ID:", error);
    return null;
  }
}

/**
 * Validate that a user ID matches the current authenticated user
 */
export async function validateUserId(userId: string): Promise<boolean> {
  const currentUserId = await getDescopeUserId();
  return currentUserId === userId;
}
