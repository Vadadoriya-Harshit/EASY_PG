import { test } from "node:test";
import assert from "node:assert/strict";
import { isSafeHref, isSafeImageUrl, cmsPatchSchema, propertySchema, publicSubscribeSchema } from "@/lib/validators";
import { safeJsonLd, escapeHtml, normalizeEmail } from "@/lib/http";
import { sampleProperties } from "@/lib/sample-data";

test("XSS: javascript:/data:text/protocol-relative URLs are rejected for links and images", () => {
  for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "//evil.example/x", "data:text/html;base64,PHNjcmlwdD4=", "https://x.test/a\" onerror=\"1", "/a b", "vbscript:x"]) {
    assert.equal(isSafeHref(bad), false, bad);
    assert.equal(isSafeImageUrl(bad), false, bad);
  }
  for (const ok of ["/pgs", "#top", "https://example.com/a?b=1", "tel:+919800000000", "mailto:a@b.co", ""]) assert.equal(isSafeHref(ok), true, ok);
  for (const ok of ["/images/a.jpg", "https://res.cloudinary.com/x/y.jpg", "data:image/webp;base64,AAAA", ""]) assert.equal(isSafeImageUrl(ok), true, ok);
  assert.equal(isSafeImageUrl("data:image/svg+xml;base64,AAAA"), false, "SVG data URLs can carry script");
});

test("CMS schema rejects unknown keys, oversize text and unsafe links", () => {
  assert.ok(cmsPatchSchema.safeParse({ hero: { line1: "Hello" } }).success);
  assert.equal(cmsPatchSchema.safeParse({ isAdmin: true }).success, false, "unknown keys are rejected");
  assert.equal(cmsPatchSchema.safeParse({ navigation: { ctaHref: "javascript:alert(1)" } }).success, false);
  assert.equal(cmsPatchSchema.safeParse({ hero: { line1: "x".repeat(500) } }).success, false);
  assert.equal(cmsPatchSchema.safeParse({ homeSections: [{ id: "nope", visible: true }] }).success, false);
  assert.ok(cmsPatchSchema.safeParse({ homeSections: [{ id: "areas", visible: false }, { id: "featured", visible: true }] }).success);
});

test("property schema accepts the sample data and rejects unsafe map/media URLs", () => {
  const p = structuredClone(sampleProperties[0]);
  assert.ok(propertySchema.safeParse(p).success, JSON.stringify(propertySchema.safeParse(p)));
  assert.equal(propertySchema.safeParse({ ...p, mapUrl: "javascript:alert(1)" }).success, false);
  assert.equal(propertySchema.safeParse({ ...p, media: [{ type: "image", url: "javascript:1", alt: "x" }] }).success, false);
});

test("subscribe schema requires explicit consent and ignores honeypot-filled bots", () => {
  assert.equal(publicSubscribeSchema.safeParse({ email: "a@b.co" }).success, false);
  assert.ok(publicSubscribeSchema.safeParse({ email: "a@b.co", consent: true }).success);
  assert.equal(publicSubscribeSchema.safeParse({ email: "a@b.co", consent: true, website: "http://spam" }).success, false);
});

test("safeJsonLd cannot break out of a script tag", () => {
  const out = safeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.ok(!out.includes("</script>"));
  assert.ok(!out.includes("<"));
  assert.equal(JSON.parse(out).name, "</script><script>alert(1)</script>");
});

test("escapeHtml / normalizeEmail", () => {
  assert.equal(escapeHtml(`<a href="x">&'`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  assert.equal(normalizeEmail("  Foo@Bar.COM "), "foo@bar.com");
  for (const bad of ["", "a", "a@b", "a b@c.co", "a@b.c", "<x@y.co>", "a@b.co\r\nBcc: z@z.co", undefined, 5]) assert.equal(normalizeEmail(bad as any), null, String(bad));
});
