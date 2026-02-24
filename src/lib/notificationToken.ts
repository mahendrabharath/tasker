import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export function createCompleteToken(taskId: string, userId: string): string {
  const secret =
    process.env.PUSH_CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Missing secret for token signing");

  const expiry = Date.now() + TOKEN_TTL_MS;
  const payload = `${taskId}|${userId}|${expiry}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sig}`;
}

export function verifyCompleteToken(
  token: string
): { taskId: string; userId: string } | null {
  const secret =
    process.env.PUSH_CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null;

  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  try {
    const payload = Buffer.from(encoded, "base64url").toString("utf8");
    const parts = payload.split("|");
    const expiryStr = parts[2];
    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || Date.now() > expiry) return null;

    const expectedSig = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");
    if (
      !timingSafeEqual(
        Buffer.from(sig, "base64url"),
        Buffer.from(expectedSig, "base64url")
      )
    ) {
      return null;
    }

    const [taskId, userId] = parts;
    return taskId && userId ? { taskId, userId } : null;
  } catch {
    return null;
  }
}
