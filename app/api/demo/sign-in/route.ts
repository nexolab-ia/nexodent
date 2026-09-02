import { auth } from "@/lib/auth";
import { readEnv } from "@/lib/env";

export async function POST() {
  const env = readEnv();
  const base = env.APP_URL ?? env.AUTH_URL;
  if (!base || !env.DEMO_PASSWORD) return Response.redirect(new URL("/demo?error=unavailable", base), 303);

  const signInUrl = new URL("/api/auth/sign-in/email", base);
  const authResponse = await auth.handler(new Request(signInUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: base,
      referer: `${base}/demo`,
    },
    body: JSON.stringify({ email: env.DEMO_EMAIL, password: env.DEMO_PASSWORD }),
  }));

  if (!authResponse.ok) return Response.redirect(new URL("/demo?error=unavailable", base), 303);

  const response = Response.redirect(new URL("/agenda", base), 303);
  for (const cookie of authResponse.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
  return response;
}