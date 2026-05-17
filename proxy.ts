import { authMiddleware } from "@descope/nextjs-sdk/server";

export default authMiddleware({
  projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID!,
  redirectUrl: "/signin", // where unauthenticated users go
  publicRoutes: ["/signin", "/sign-up", "/api/public"], // add more as needed
});

export const config = {
  matcher: "/((?!.+\\.[\\w]+$|_next).*)", // apply to all non-static routes
};
