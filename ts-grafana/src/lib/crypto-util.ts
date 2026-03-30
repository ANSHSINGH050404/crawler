/** Non-reversible fingerprint for storing alongside events (privacy-preserving audit). */
export async function hashIp(ip: string): Promise<string | undefined> {
  if (!ip || ip === "unknown") return undefined;
  const data = new TextEncoder().encode(ip + (process.env.IP_SALT ?? "analytics"));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
