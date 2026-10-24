import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { BASE, Client, OWNER, SECRET, lastCode, mailsTo, redirectTarget, sleep, startServer, stopServer } from "./harness";

let n = 0;
const client = () => {
  const c = new Client();
  const ip = `10.1.${++n}.7`;
  const orig = c.req.bind(c);
  c.req = (m, u, o = {}) => orig(m, u, { ...o, headers: { "x-forwarded-for": ip, ...(o.headers || {}) } });
  return c;
};

before(async () => { await startServer({ mode: "dev" }); });
after(async () => { await stopServer(); });

async function signIn(c: Client, email: string, password: string, force = false) {
  const login = await c.post("/api/auth/login", { email, password, force });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  const code = lastCode(email);
  const v = await c.post("/api/auth/verify-otp", { otp: code });
  assert.equal(v.status, 200, JSON.stringify(v.body));
  return v;
}

test("protected pages and APIs reject unauthenticated requests", async () => {
  const c = client();
  const page = await c.get("/admin");
  assert.ok([302, 307, 308].includes(page.status), `/admin should redirect, got ${page.status}`);
  assert.match(redirectTarget(page), /\/admin\/login/);
  for (const [method, url] of [
    ["GET", "/api/admin/profile"], ["POST", "/api/admin/profile"], ["GET", "/api/admin/users"], ["POST", "/api/admin/users"],
    ["DELETE", "/api/admin/users?email=a@b.co"], ["POST", "/api/admin/properties"], ["DELETE", "/api/admin/properties/x-y"],
    ["POST", "/api/admin/areas"], ["DELETE", "/api/admin/areas?slug=ab"], ["PATCH", "/api/admin/inquiries/abcdef"],
    ["GET", "/api/admin/cms/content"], ["POST", "/api/admin/cms/content"], ["DELETE", "/api/admin/cms/content"],
    ["POST", "/api/admin/upload-sign"], ["GET", "/api/admin/vacancies"], ["POST", "/api/admin/vacancies"],
    ["PATCH", "/api/admin/vacancies/vs_aaaaaaaaaaaaaaaaaa"], ["DELETE", "/api/admin/vacancies/vs_aaaaaaaaaaaaaaaaaa"],
    ["GET", "/api/admin/vacancy-notifications"], ["POST", "/api/admin/vacancy-notifications"], ["GET", "/api/admin/audit"],
  ] as const) {
    const r = await c.req(method, url, { json: method === "GET" || method === "DELETE" ? undefined : {} });
    assert.equal(r.status, 401, `${method} ${url} -> ${r.status}`);
  }
  for (const p of ["/admin/vacancies", "/admin/cms", "/admin/users", "/admin/properties", "/admin/audit"]) {
    const r = await c.get(p);
    assert.ok([302, 307, 308].includes(r.status), `${p} -> ${r.status}`);
  }
});

test("SECURITY REGRESSION: a session token forged with the old hard-coded secret is rejected", async () => {
  const oldSecret = new TextEncoder().encode("sorath-pg-secure-auth-secret-key-32chars-min!");
  const forged = await new SignJWT({ email: OWNER.email, role: "superadmin", sid: "forged" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(oldSecret);
  const c = client();
  c.jar.set("sorath_admin", forged);
  assert.equal((await c.get("/api/admin/profile")).status, 401);
  assert.equal((await c.get("/api/admin/users")).status, 401);
  const page = await c.get("/admin");
  assert.match(redirectTarget(page), /\/admin\/login/);
});

test("SECURITY REGRESSION: a correctly signed token WITHOUT a server-side session is rejected (and does not loop)", async () => {
  const key = new TextEncoder().encode(SECRET);
  const tok = await new SignJWT({ email: OWNER.email, sid: "no-such-session" })
    .setProtectedHeader({ alg: "HS256" }).setIssuer("luxora-pg").setAudience("luxora-admin").setExpirationTime("1h").sign(key);
  const c = client();
  c.jar.set("sorath_admin", tok);
  assert.equal((await c.get("/api/admin/profile")).status, 401, "valid signature but no live session");
  // Old behaviour: middleware bounced /admin/login -> /admin and the page bounced back -> infinite redirect loop.
  const login = await c.get("/admin/login");
  assert.equal(login.status, 200, "login page must render, not redirect, for a dead session");
  const dash = await c.get("/admin");
  assert.match(redirectTarget(dash), /\/admin\/login/);
});

test("cross-site POSTs are blocked", async () => {
  const c = client();
  const r = await c.post("/api/auth/login", { email: OWNER.email, password: "x" }, { headers: { origin: "https://evil.example" } });
  assert.equal(r.status, 403);
  const ok = await c.post("/api/auth/login", { email: "nobody@example.test", password: "x" }, { headers: { origin: BASE } });
  assert.equal(ok.status, 401);
});

test("login: invalid credentials give one generic message (no account enumeration)", async () => {
  const c = client();
  const wrongPw = await c.post("/api/auth/login", { email: OWNER.email, password: "totally-wrong-1" });
  const noUser = await c.post("/api/auth/login", { email: "ghost@example.test", password: "totally-wrong-1" });
  assert.equal(wrongPw.status, 401);
  assert.equal(noUser.status, 401);
  assert.equal(wrongPw.body.error, noUser.body.error);
  assert.equal((await c.post("/api/auth/login", { email: "", password: "" })).status, 400);
  assert.equal((await c.post("/api/auth/login", { email: 5, password: {} })).status, 400);
  assert.equal(c.jar.has("sorath_admin"), false);
});

test("OTP: cannot verify without having passed the password step; wrong code, resend cooldown, lock-out", async () => {
  const c = client();
  const noChallenge = await c.post("/api/auth/verify-otp", { otp: "123456" });
  assert.equal(noChallenge.status, 401);
  assert.equal(noChallenge.body.restart, true);

  const login = await c.post("/api/auth/login", { email: OWNER.email, password: OWNER.password });
  assert.equal(login.status, 200);
  assert.equal(login.body.requireOtp, true);
  assert.ok(c.jar.has("sorath_otp"), "challenge cookie set");
  assert.ok(!JSON.stringify(login.body).includes(OWNER.email), "email is masked in the response");
  const sc = login.setCookies.find((x) => x.startsWith("sorath_otp="))!;
  assert.match(sc, /HttpOnly/i);
  assert.match(sc, /SameSite=Strict/i);

  const code = lastCode(OWNER.email);
  const wrong = code === "000000" ? "111111" : "000000";
  const bad = await c.post("/api/auth/verify-otp", { otp: wrong });
  assert.equal(bad.status, 401);
  assert.match(bad.body.error, /4 attempt/);

  const resend = await c.post("/api/auth/resend-otp");
  assert.equal(resend.status, 429, "resend inside the 60s cooldown is refused");
  assert.ok(resend.body.retryAfterSec > 0);

  // exhaust the remaining attempts
  for (let i = 0; i < 4; i++) await c.post("/api/auth/verify-otp", { otp: wrong });
  const after = await c.post("/api/auth/verify-otp", { otp: code });
  assert.equal(after.status, 401, "correct code is useless once locked");
  assert.equal(c.jar.has("sorath_admin"), false);
});

test("full sign-in: cookie flags, session works, logout revokes the token server-side", async () => {
  const c = client();
  const v = await signIn(c, OWNER.email, OWNER.password);
  const sc = v.setCookies.find((x) => x.startsWith("sorath_admin="))!;
  assert.match(sc, /HttpOnly/i);
  assert.match(sc, /SameSite=Strict/i);
  assert.ok(!/max-age|expires/i.test(sc), "session cookie, not persistent");

  const me = await c.get("/api/admin/profile");
  assert.equal(me.status, 200);
  assert.equal(me.body.profile.email, OWNER.email);
  assert.equal(me.body.profile.role, "superadmin");
  assert.ok(!JSON.stringify(me.body).toLowerCase().includes("hash"));
  assert.equal((await c.get("/admin")).status, 200);
  // signed-in users bounce away from the login page (server-side check, no loop)
  assert.match(redirectTarget(await c.get("/admin/login")), /\/admin$/);

  const stolen = c.jar.get("sorath_admin")!;
  const out = await c.post("/api/auth/logout");
  assert.equal(out.status, 200);
  assert.equal(c.jar.has("sorath_admin"), false, "cookie cleared");

  const thief = client();
  thief.jar.set("sorath_admin", stolen);
  assert.equal((await thief.get("/api/admin/profile")).status, 401, "token copied before logout must stop working");
  assert.equal((await thief.post("/api/admin/vacancy-notifications", { action: "process" })).status, 401);
});

test("single active session: second sign-in is refused until forced, and forcing replaces the first session", async () => {
  const a = client();
  await signIn(a, OWNER.email, OWNER.password);
  assert.equal((await a.get("/api/admin/profile")).status, 200);

  const b = client();
  const blocked = await b.post("/api/auth/login", { email: OWNER.email, password: OWNER.password });
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.alreadyLoggedIn, true);
  assert.equal(b.jar.has("sorath_otp"), false, "no OTP challenge is issued while blocked");
  assert.equal((await a.get("/api/admin/profile")).status, 200, "knowing the password alone must not kick the real admin out");

  await sleep(100);
  // wait out nothing: OTP cooldown is per account (60s); use direct force flow
  const forced = await b.post("/api/auth/login", { email: OWNER.email, password: OWNER.password, force: true });
  assert.equal(forced.status, 200);
  assert.equal((await a.get("/api/admin/profile")).status, 200, "still valid until the OTP step completes");
  const code = lastCode(OWNER.email);
  const ver = await b.post("/api/auth/verify-otp", { otp: code });
  assert.equal(ver.status, 200);
  assert.equal((await a.get("/api/admin/profile")).status, 401, "first session replaced");
  assert.equal((await b.get("/api/admin/profile")).status, 200);
  await b.post("/api/auth/logout");
});

test("login endpoint is rate limited", async () => {
  const c = client();
  let last = 0;
  for (let i = 0; i < 18; i++) last = (await c.post("/api/auth/login", { email: `rl${i % 2}@example.test`, password: "nope-nope-1" })).status;
  assert.equal(last, 429);
});

test("role enforcement: a plain admin cannot manage users, reset CMS, or read the audit log", async () => {
  const owner = client();
  await signIn(owner, OWNER.email, OWNER.password);

  const weak = await owner.post("/api/admin/users", { name: "Weak", email: "weak@example.test", password: "short1", role: "admin" });
  assert.equal(weak.status, 400);
  const badRole = await owner.post("/api/admin/users", { name: "X", email: "x@example.test", password: "Long-Enough-Pw1", role: "root" });
  assert.equal(badRole.status, 400);
  const created = await owner.post("/api/admin/users", { name: "Staff", email: "staff@example.test", password: "Staff-Pass-2026", role: "admin" });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  assert.ok(!JSON.stringify(created.body).toLowerCase().includes("hash"));
  const list = await owner.get("/api/admin/users");
  assert.ok(!JSON.stringify(list.body).toLowerCase().includes("hash"), "user list never exposes hashes");
  assert.equal((await owner.get("/api/admin/audit")).status, 200);
  assert.equal((await owner.del("/api/admin/users?email=" + encodeURIComponent(OWNER.email))).status, 400, "cannot delete yourself / last super admin");

  const staff = client();
  await signIn(staff, "staff@example.test", "Staff-Pass-2026");
  assert.equal((await staff.get("/api/admin/profile")).body.profile.role, "admin");
  assert.equal((await staff.get("/api/admin/users")).status, 403);
  assert.equal((await staff.post("/api/admin/users", { email: "evil@example.test", password: "Evil-Pass-2026", role: "superadmin" })).status, 403);
  assert.equal((await staff.del("/api/admin/users?email=" + encodeURIComponent(OWNER.email))).status, 403);
  assert.equal((await staff.del("/api/admin/cms/content")).status, 403);
  assert.equal((await staff.get("/api/admin/audit")).status, 403);
  const page = await staff.get("/admin/users");
  assert.match(redirectTarget(page), /\/admin$/, "page also redirects non-super admins");
  // an admin can use ordinary admin features
  assert.equal((await staff.get("/api/admin/vacancies")).status, 200);
  // client-supplied role in the profile update body is ignored
  const prof = await staff.post("/api/admin/profile", { name: "Staff Person", role: "superadmin" });
  assert.equal(prof.status, 200);
  assert.equal(prof.body.profile.role, "admin");

  // super admin disables nothing here; deleting the staff account kills their session too
  assert.equal((await owner.del("/api/admin/users?email=staff%40example.test")).status, 200);
  assert.equal((await staff.get("/api/admin/profile")).status, 401);
  await owner.post("/api/auth/logout");
});

test("password reset: neutral answers, OTP required, policy enforced, old password and sessions die", async () => {
  const c = client();
  const unknown = await c.post("/api/auth/forgot-password", { email: "ghost@example.test" });
  const known = await c.post("/api/auth/forgot-password", { email: OWNER.email });
  assert.equal(unknown.status, 200);
  assert.equal(known.status, 200);
  assert.equal(unknown.body.message, known.body.message, "same message for known and unknown emails");
  assert.equal(mailsTo("ghost@example.test").length, 0, "no mail for unknown accounts");
  assert.ok(mailsTo(OWNER.email).some((m) => /reset/i.test(m.subject)));

  const code = lastCode(OWNER.email);
  assert.equal((await c.post("/api/auth/reset-password", { email: OWNER.email, otp: "000000", newPassword: "New-Strong-Pass-77" })).status, 400);
  assert.equal((await c.post("/api/auth/reset-password", { email: OWNER.email, otp: code, newPassword: "weak" })).status, 400);
  const ok = await c.post("/api/auth/reset-password", { email: OWNER.email, otp: code, newPassword: "New-Strong-Pass-77" });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal((await c.post("/api/auth/reset-password", { email: OWNER.email, otp: code, newPassword: "Another-Pass-88x" })).status, 400, "reset code is single use");
  assert.equal((await c.post("/api/auth/login", { email: OWNER.email, password: OWNER.password })).status, 401, "old password no longer works");
});
