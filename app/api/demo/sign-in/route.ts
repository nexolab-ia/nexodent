import { auth } from "@/lib/auth";
import { readEnv } from "@/lib/env";

export async function POST(request: Request) {
  const env = readEnv();
  if (!env.DEMO_PASSWORD) return Response.redirect(new URL("/demo?error=unavailable", request.url), 303);

  const authResponse = await auth.handler(new Request(new URL("/api/auth/sign-in/email", request.url), {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: new URL(request.url).origin },
    body: JSON.stringify({ email: env.DEMO_EMAIL, password: env.DEMO_PASSWORD }),
  }));

  if (!authResponse.ok) return Response.redirect(new URL("/demo?error=unavailable", request.url), 303);

  const response = Response.redirect(new URL("/agenda", request.url), 303);
  for (const cookie of authResponse.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
  return response;
}
