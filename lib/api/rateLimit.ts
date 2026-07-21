import "server-only";

// Rate limit best-effort, in memoria. Nota onesta: su Vercel le funzioni
// serverless sono piu' istanze e la memoria non e' condivisa, quindi questo
// non e' un limite forte. Serve a frenare un singolo client che martella lo
// stesso endpoint, non a difendere da un attacco distribuito. Per un limite
// vero servirebbe uno store condiviso (es. Upstash/Redis o una tabella).

interface Window {
  hits: number[];
}

const buckets = new Map<string, Window>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  const recent = bucket.hits.filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    buckets.set(key, { hits: recent });
    const oldest = recent[0];
    return { ok: false, retryAfterMs: windowMs - (now - oldest) };
  }

  recent.push(now);
  buckets.set(key, { hits: recent });

  // Pulizia opportunistica: evita che la mappa cresca all'infinito.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.hits.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  return { ok: true, retryAfterMs: 0 };
}

// Estrae un IP ragionevole dalle intestazioni del proxy (Vercel imposta
// x-forwarded-for). Se manca, tutti finiscono nello stesso bucket "unknown":
// accettabile per un limite best-effort.
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
