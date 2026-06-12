/** Auth.js secret — required in production (Railway, etc.). */
export function getAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || undefined;
}

/** HTTPS deploys (Railway) use __Secure-authjs.session-token — getToken must match. */
export function useSecureSessionCookies(req?: {
  headers: Headers;
  nextUrl?: { protocol: string };
}): boolean {
  if (req) {
    if (req.nextUrl?.protocol === "https:") return true;
    const forwarded = req.headers.get("x-forwarded-proto");
    if (forwarded?.split(",")[0]?.trim() === "https") return true;
  }
  const url = process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || "";
  if (url.startsWith("https://")) return true;
  return process.env.NODE_ENV === "production";
}

export function assertAuthSecretConfigured(): void {
  if (getAuthSecret()) return;
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[auth] AUTH_SECRET is not set. Add it in Railway → Variables (openssl rand -base64 32)."
    );
  }
}
