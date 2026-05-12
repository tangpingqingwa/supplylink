import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/((?!login|setup|api/auth|api/setup|api/webhooks|_next/static|_next/image|favicon.ico).*)",
  ],
};
