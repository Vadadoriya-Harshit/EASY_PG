import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { hashPassword, verifyPassword, passwordPolicyError, safeEqual } from "@/lib/passwords";

test("scrypt hashes are salted and verify", async () => {
  const a = await hashPassword("Correct-Horse-9");
  const b = await hashPassword("Correct-Horse-9");
  assert.notEqual(a, b, "same password must produce different hashes");
  assert.ok(a.startsWith("scrypt$"));
  assert.deepEqual(await verifyPassword("Correct-Horse-9", a), { ok: true, needsRehash: false });
  assert.equal((await verifyPassword("wrong-password-1", a)).ok, false);
});

test("SECURITY: submitting the stored hash as the password does not authenticate (pass-the-hash)", async () => {
  const stored = await hashPassword("Correct-Horse-9");
  assert.equal((await verifyPassword(stored, stored)).ok, false);
  const legacy = crypto.createHash("sha256").update("sorath2026" + "sorath-pg-salt-2026").digest("hex");
  assert.equal((await verifyPassword(legacy, legacy)).ok, false, "legacy hash string must not work as a password");
});

test("legacy SHA-256 hashes still verify once and are flagged for upgrade", async () => {
  const legacy = crypto.createHash("sha256").update("sorath2026" + "sorath-pg-salt-2026").digest("hex");
  assert.deepEqual(await verifyPassword("sorath2026", legacy), { ok: true, needsRehash: true });
  assert.equal((await verifyPassword("nope", legacy)).ok, false);
});

test("legacy plaintext records verify once and are flagged for upgrade", async () => {
  assert.deepEqual(await verifyPassword("hunter2hunter2", "hunter2hunter2"), { ok: true, needsRehash: true });
  assert.equal((await verifyPassword("other", "hunter2hunter2")).ok, false);
});

test("empty / missing inputs never authenticate", async () => {
  assert.equal((await verifyPassword("", "x")).ok, false);
  assert.equal((await verifyPassword("x", "")).ok, false);
  assert.equal((await verifyPassword("x", undefined)).ok, false);
  assert.equal((await verifyPassword("x", "scrypt$garbage")).ok, false);
});

test("password policy", () => {
  assert.ok(passwordPolicyError("short1"));
  assert.ok(passwordPolicyError("onlyletterslong"));
  assert.ok(passwordPolicyError("1234567890123"));
  assert.ok(passwordPolicyError("a".repeat(200) + "1"));
  assert.equal(passwordPolicyError("GoodPassw0rdHere"), null);
});

test("safeEqual", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
});
