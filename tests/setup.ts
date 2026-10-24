// Loaded before every unit test file: never touch a real database or mail server.
process.env.AUTH_SECRET = "unit-test-secret-unit-test-secret-unit-test-secret";
process.env.MONGODB_URI = "";
process.env.SMTP_HOST = "";
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";
process.env.ADMIN_EMAIL = "";
process.env.ADMIN_PASSWORD = "";
process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
(process.env as Record<string, string>).NODE_ENV = "test";
