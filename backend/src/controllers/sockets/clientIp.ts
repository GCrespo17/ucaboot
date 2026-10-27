// Client IP behind `hops` trusted proxies, with the same rule Express applies to req.ip
// when "trust proxy" is a number. X-Forwarded-For is "client, proxy1, proxy2" and each
// proxy appends the address it received the request from, so only the last `hops`
// entries were written by our own proxies. Anything further left was sent by the
// client and can be forged, so it is never trusted.
export function clientIp(remoteAddress: string, forwardedFor: string | string[] | undefined, hops: number): string {
  const header = Array.isArray(forwardedFor) ? forwardedFor.join(",") : forwardedFor ?? "";
  const forwarded = header
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  // Nearest first: the socket's peer, then the X-Forwarded-For entries from right to left
  const chain = [remoteAddress, ...forwarded.reverse()];
  return chain[Math.min(hops, chain.length - 1)] ?? remoteAddress;
}
