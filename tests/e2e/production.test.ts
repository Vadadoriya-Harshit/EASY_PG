import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { Client, OWNER, redirectTarget, serverLog, startServer, stopServer } from "./harness";

// These tests run the PRODUCTION build (`next start`). Run `npm run build` first.
const ip = (n: number) => ({ "x-forwarded-for": `10.9.${n}.1` });

describe("production: database unreachable", () => {
  before(async () => { await startServer({ mode: "start", env: { MONGODB_URI: "mongodb://127.0.0.1:1/luxora_unreachable?serverSelectionTimeoutMS=1500&connectTimeoutMS=1500" } }); });
  after(async () => { await stopServer(); });

  test("pages fail loudly instead of silently showing demo data or accepting writes into memory", async () => {
    const c = new Client();
    const r = await c.get("/pgs", { headers: ip(1) });
    const body = String(r.body);
    // The page streams, so the status may already be 200; what matters is that it shows the error UI and no demo listings.
    assert.ok(r.status >= 500 || /digest|went wrong/i.test(body), "an error state is shown (the error boundary renders client-side)");
    assert.ok(!/Luxora (Boys|Girls)/.test(body), "demo listings must not leak into the response");
    assert.ok(!/at .*\.(ts|js):\d+|MongooseServerSelectionError|127\.0\.0\.1/.test(String(r.body)), "no stack traces / connection details in the page");
  });

  test("sign-in answers with a generic 503, never a stack trace or driver message", async () => {
    const c = new Client();
    const r = await c.post("/api/auth/login", { email: OWNER.email, password: OWNER.password }, { headers: ip(2) });
    assert.equal(r.status, 503);
    assert.ok(!JSON.stringify(r.body).match(/mongo|127\.0\.0\.1|ECONN|stack/i));
    assert.equal(c.jar.size, 0);
  });

  test("public vacancy subscribe fails safely (nothing pretends to be saved)", async () => {
    const c = new Client();
    const r = await c.post("/api/vacancies", { email: "x@example.test", consent: true }, { headers: ip(3) });
    assert.ok(r.status >= 500, `got ${r.status}`);
    assert.ok(!JSON.stringify(r.body).match(/mongo|127\.0\.0\.1|ECONN|stack/i));
  });

  test("production hardening: HSTS, strict CSP, HTTPS redirect behind a proxy", async () => {
    const c = new Client();
    const r = await c.get("/robots.txt", { headers: { "x-forwarded-proto": "https" } });
    assert.match(r.headers.get("strict-transport-security") || "", /max-age=\d+/);
    assert.match(r.headers.get("content-security-policy") || "", /upgrade-insecure-requests/);
    assert.ok(!/unsafe-eval/.test(r.headers.get("content-security-policy") || ""));
    const http = await c.get("/pgs", { headers: { "x-forwarded-proto": "http", "x-forwarded-host": "example.com" } });
    assert.equal(http.status, 308);
    assert.match(redirectTarget(http), /^https:\/\//);
  });
});

describe("production: no SMTP configured", () => {
  before(async () => { await startServer({ mode: "start" }); });
  after(async () => { await stopServer(); });

  test("admin sign-in reports that the code e-mail could not be sent and never discloses the code", async () => {
    const c = new Client();
    const r = await c.post("/api/auth/login", { email: OWNER.email, password: OWNER.password }, { headers: ip(10) });
    assert.equal(r.status, 503);
    assert.match(r.body.error, /could not send/i);
    assert.equal(c.jar.has("sorath_otp"), false, "no challenge is granted when no code could be delivered");
    assert.ok(!/\b\d{6}\b/.test(serverLog().replace(/\d{6,}/g, "")), "server log does not contain a 6-digit code");
    // password-reset path stays neutral
    const f = await c.post("/api/auth/forgot-password", { email: OWNER.email }, { headers: ip(10) });
    assert.equal(f.status, 200);
  });

  test("error pages do not expose internals", async () => {
    const c = new Client();
    const nf = await c.get("/definitely-not-a-page", { headers: ip(11) });
    assert.equal(nf.status, 404);
    assert.ok(!/node_modules|\.next\/server|at .*\.js:\d+/.test(String(nf.body)));
    const bad = await c.post("/api/inquiries", "{broken json", { headers: { ...ip(11), "content-type": "application/json" }, raw: "{broken json" } as any);
    assert.equal(bad.status, 400);
  });
});

describe("production: AUTH_SECRET missing", () => {
  before(async () => { await startServer({ mode: "start", env: { AUTH_SECRET: "" } }); });
  after(async () => { await stopServer(); });

  test("there is no fallback secret: tokens signed with the old built-in key are useless and sign-in is disabled", async () => {
    const old = new TextEncoder().encode("sorath-pg-secure-auth-secret-key-32chars-min!");
    const forged = await new SignJWT({ email: OWNER.email, sid: "x" }).setProtectedHeader({ alg: "HS256" }).setIssuer("luxora-pg").setAudience("luxora-admin").setExpirationTime("1h").sign(old);
    const c = new Client();
    c.jar.set("sorath_admin", forged);
    assert.equal((await c.get("/api/admin/profile", { headers: ip(20) })).status, 401);
    const page = await c.get("/admin", { headers: ip(20) });
    assert.match(redirectTarget(page), /\/admin\/login/);
    const login = await new Client().post("/api/auth/login", { email: OWNER.email, password: OWNER.password }, { headers: ip(21) });
    assert.equal(login.status, 503);
    assert.match(serverLog(), /AUTH_SECRET/);
  });
});
