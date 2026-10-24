import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const PORT = Number(process.env.E2E_PORT || 3101);
export const BASE = `http://localhost:${PORT}`;
export const SECRET = "e2e-secret-e2e-secret-e2e-secret-e2e-secret-1234";
export const OWNER = { email: "owner@example.test", password: "Owner-Pass-2026x" };
export const CRON_SECRET = "e2e-cron-secret-0123456789";

export const outboxDir = fs.mkdtempSync(path.join(os.tmpdir(), "luxora-outbox-"));

let server: ChildProcess | null = null;
let log = "";
export const serverLog = () => log;

/**
 * Starts the real Next.js server. Every external service is blanked or redirected:
 * no database (in-memory demo store), no SMTP (messages are written to a temp folder).
 */
export async function startServer(opts: { mode: "dev" | "start"; env?: Record<string, string> } = { mode: "dev" }) {
  const env = {
    ...process.env,
    PORT: String(PORT),
    AUTH_SECRET: SECRET,
    MONGODB_URI: "",
    MONGODB_USERNAME: "",
    MONGODB_PASSWORD: "",
    SMTP_HOST: "",
    SMTP_USER: "",
    SMTP_PASS: "",
    SMTP_FROM: "",
    ADMIN_EMAIL: OWNER.email,
    ADMIN_PASSWORD: OWNER.password,
    CRON_SECRET,
    EMAIL_DRIVER: opts.mode === "dev" ? "file" : "",
    MAIL_OUTBOX_DIR: outboxDir,
    NEXT_PUBLIC_SITE_URL: BASE,
    NEXT_TELEMETRY_DISABLED: "1",
    ...(opts.env || {}),
  };
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const args = opts.mode === "dev" ? [nextBin, "dev", "-p", String(PORT)] : [nextBin, "start", "-p", String(PORT)];
  const child = spawn(process.execPath, args, { env: env as NodeJS.ProcessEnv, cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
  server = child;
  child.stdout!.on("data", (d) => (log += d));
  child.stderr!.on("data", (d) => (log += d));

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/robots.txt`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start:\n" + log.slice(-2000));
}

export async function stopServer() {
  if (!server) return;
  const p = server;
  server = null;
  await new Promise<void>((resolve) => {
    p.once("exit", () => resolve());
    if (process.platform === "win32" && p.pid) spawn("taskkill", ["/pid", String(p.pid), "/t", "/f"]);
    else p.kill("SIGTERM");
    setTimeout(resolve, 5000);
  });
  fs.rmSync(outboxDir, { recursive: true, force: true });
}

// ------------------------------------------------------------ tiny HTTP client with a cookie jar
export class Client {
  jar = new Map<string, string>();
  async req(method: string, url: string, opts: { json?: unknown; headers?: Record<string, string>; raw?: BodyInit; noCookies?: boolean } = {}) {
    const headers: Record<string, string> = { ...(opts.headers || {}) };
    if (opts.json !== undefined) headers["content-type"] = "application/json";
    if (!opts.noCookies && this.jar.size) headers["cookie"] = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await fetch(url.startsWith("http") ? url : BASE + url, {
      method, headers, redirect: "manual",
      body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.raw,
    });
    for (const sc of res.headers.getSetCookie?.() || []) {
      const [pair] = sc.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i), value = pair.slice(i + 1);
      if (/;\s*max-age=0/i.test(sc) || value === "") this.jar.delete(name);
      else this.jar.set(name, value);
    }
    let body: any = null;
    const text = await res.text();
    try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, headers: res.headers, body, setCookies: res.headers.getSetCookie?.() || [] };
  }
  get = (u: string, o = {}) => this.req("GET", u, o);
  post = (u: string, json?: unknown, o: any = {}) => this.req("POST", u, { json, ...o });
  patch = (u: string, json?: unknown, o: any = {}) => this.req("PATCH", u, { json, ...o });
  del = (u: string, o: any = {}) => this.req("DELETE", u, o);
}

// ------------------------------------------------------------ outbox helpers
export function mails(): { to: string; subject: string; text: string; html: string; at: string }[] {
  if (!fs.existsSync(outboxDir)) return [];
  return fs.readdirSync(outboxDir).sort().map((f) => JSON.parse(fs.readFileSync(path.join(outboxDir, f), "utf8")));
}
export const mailsTo = (to: string) => mails().filter((m) => m.to === to);
export function lastCode(to: string): string {
  const m = mailsTo(to).filter((x) => /\b\d{6}\b/.test(x.text)).at(-1);
  if (!m) throw new Error("no code mail for " + to);
  return m.text.match(/\b(\d{6})\b/)![1];
}
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Where a response sends the browser: a real 3xx Location, or the framework's streamed redirect (HTTP 200 + meta refresh). */
export function redirectTarget(res: { status: number; headers: Headers; body: any }): string {
  const loc = res.headers.get("location");
  if (loc) return loc;
  const m = typeof res.body === "string" ? res.body.match(/NEXT_REDIRECT;(?:replace|push);([^;"\\]+)/) : null;
  return m ? m[1] : "";
}
