// woki-bridge/firma.ts · Firma del webhook de wapi: X-Webhook-Signature = HMAC-SHA256(secreto, cuerpo crudo) en hex.
// El secreto en texto plano NO vale como firma: en wapi se activa con webhook_hmac = true (ver deploy/instalar.sh).
import type http from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";

export function firmaValida(secret: string, raw: string | Buffer, sig?: string | string[]) {
  const s = typeof sig === "string" ? sig.trim() : "";
  if (!secret || !/^[0-9a-f]{64}$/i.test(s)) return false;
  return timingSafeEqual(createHmac("sha256", secret).update(raw).digest(), Buffer.from(s, "hex"));   // 32 bytes contra 32, en tiempo constante
}

// El cuerpo tal como llegó, en bytes: unir trozos como texto puede partir una letra con tilde o un emoji y romper la firma.
export const leerCrudo = (req: http.IncomingMessage) =>
  new Promise<Buffer>((ok, ko) => { const b: Buffer[] = []; req.on("data", (c: Buffer) => b.push(c)); req.on("end", () => ok(Buffer.concat(b))); req.on("error", ko); });
