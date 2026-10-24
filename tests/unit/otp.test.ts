import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { issueOtp, verifyOtp, OTP_MAX_ATTEMPTS, OTP_MAX_SENDS_PER_HOUR } from "@/lib/otp";
import { collection, __resetMemoryStore } from "@/lib/db";

beforeEach(() => __resetMemoryStore());

const E = "admin@example.test";

async function fresh(purpose: "login" | "reset" = "login", email = E) {
  const r = await issueOtp(email, purpose);
  assert.ok(r.ok);
  return (r as Extract<typeof r, { ok: true }>).code;
}

test("codes are 6 digits and the stored value is a hash, not the code", async () => {
  const code = await fresh();
  assert.match(code, /^\d{6}$/);
  const rec = await collection("auth_otps").findOne({ key: `login:${E}` });
  assert.ok(rec);
  assert.ok(!JSON.stringify(rec).includes(code), "plaintext code must not be stored");
});

test("valid code verifies exactly once", async () => {
  const code = await fresh();
  assert.deepEqual(await verifyOtp(E, code, "login"), { valid: true });
  const again = await verifyOtp(E, code, "login");
  assert.equal(again.valid, false, "a used code can not be replayed");
});

test("wrong code is rejected and counts attempts, then locks", async () => {
  const code = await fresh();
  const wrong = code === "000000" ? "111111" : "000000";
  for (let i = 1; i < OTP_MAX_ATTEMPTS; i++) {
    const r = await verifyOtp(E, wrong, "login");
    assert.equal(r.valid, false);
    assert.equal((r as any).reason, "invalid");
    assert.equal((r as any).attemptsLeft, OTP_MAX_ATTEMPTS - i);
  }
  const last = await verifyOtp(E, wrong, "login");
  assert.equal((last as any).reason, "locked");
  // even the correct code no longer works after lock-out
  assert.equal((await verifyOtp(E, code, "login")).valid, false);
});

test("parallel guesses can not exceed the attempt limit", async () => {
  const code = await fresh();
  const wrong = code === "123456" ? "654321" : "123456";
  const results = await Promise.all(Array.from({ length: 20 }, () => verifyOtp(E, wrong, "login")));
  const counted = results.filter((r) => !r.valid && (r as any).reason === "invalid").length;
  assert.ok(counted <= OTP_MAX_ATTEMPTS, `only ${OTP_MAX_ATTEMPTS} guesses may be evaluated, got ${counted}`);
});

test("expired code is rejected", async () => {
  const code = await fresh();
  await collection("auth_otps").updateOne({ key: `login:${E}` }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  const r = await verifyOtp(E, code, "login");
  assert.equal(r.valid, false);
  assert.ok(["expired", "none"].includes((r as any).reason));
});

test("resend cooldown: second code within 60s is refused, and a new code invalidates the old one", async () => {
  const first = await fresh();
  const second = await issueOtp(E, "login");
  assert.equal(second.ok, false);
  assert.equal((second as any).reason, "cooldown");
  assert.ok((second as any).retryAfterSec > 0 && (second as any).retryAfterSec <= 60);

  // age the cooldown, then resend
  await collection("auth_otps").updateOne({ key: `login:${E}` }, { $set: { sentAt: Date.now() - 61_000 } });
  const third = await issueOtp(E, "login");
  assert.ok(third.ok);
  const newCode = (third as any).code as string;
  if (newCode !== first) assert.equal((await verifyOtp(E, first, "login")).valid, false, "old code is invalid after resend");
  assert.equal((await verifyOtp(E, newCode, "login")).valid, true);
});

test("hourly send cap", async () => {
  for (let i = 0; i < OTP_MAX_SENDS_PER_HOUR; i++) {
    await collection("auth_otps").deleteMany({}); // clear cooldown only
    const r = await issueOtp(E, "login");
    assert.ok(r.ok, `send ${i + 1} should be allowed`);
  }
  await collection("auth_otps").deleteMany({});
  const over = await issueOtp(E, "login");
  assert.equal(over.ok, false);
  assert.equal((over as any).reason, "limit");
});

test("login and reset codes are separate; other accounts are separate", async () => {
  const login = await fresh("login");
  const reset = await fresh("reset");
  assert.equal((await verifyOtp(E, login, "reset")).valid, login === reset);
  const other = await fresh("login", "other@example.test");
  assert.equal((await verifyOtp(E, other, "login")).valid, other === login);
});

test("malformed codes never verify", async () => {
  await fresh();
  for (const bad of ["", "12345", "1234567", "abcdef", "12 456", "٠٠٠٠٠٠"]) {
    assert.equal((await verifyOtp(E, bad, "login")).valid, false);
  }
});
