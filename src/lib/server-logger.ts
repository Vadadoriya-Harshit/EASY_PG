import mongoose from "mongoose";
import { connect } from "./models";

const g = globalThis as any;

/**
 * Mask credentials in MongoDB connection string for safe console logging.
 */
export function maskMongoUri(uri: string): string {
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, "$1****$3");
  } catch {
    return "mongodb://[protected]";
  }
}

/**
 * Logs comprehensive server startup details, including environment and MongoDB configuration status.
 */
export async function logServerStartup() {
  if (g.__luxoraStartupLogged) return;
  g.__luxoraStartupLogged = true;

  const env = process.env.NODE_ENV || "development";
  const port = process.env.PORT || "3000";
  const mongoUri = process.env.MONGODB_URI?.trim();

  console.log("\n" + "=".repeat(72));
  console.log("🚀 LUXORA PG SERVER INITIALIZED");
  console.log(`   Mode        : ${env.toUpperCase()}`);
  console.log(`   Local URL   : http://localhost:${port}`);
  console.log(`   Timestamp   : ${new Date().toISOString()}`);
  console.log("-".repeat(72));

  if (!mongoUri) {
    console.log("⚠️  DATABASE STATUS: NOT CONFIGURED (MONGODB_URI is not set)");
    console.log("   • The server is running in IN-MEMORY DEMO MODE with sample data.");
    console.log("   • Any changes (properties, CMS, inquiries) will NOT persist across restarts.");
    console.log("   • To connect a real database, add MONGODB_URI in your .env file:");
    console.log("     MONGODB_URI='mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>'");
    console.log("=".repeat(72) + "\n");
    return;
  }

  const maskedUri = maskMongoUri(mongoUri);
  console.log("🔗 DATABASE STATUS: CONFIGURED (MONGODB_URI detected)");
  console.log(`   • Target URI : ${maskedUri}`);
  console.log("   • Verifying MongoDB Atlas connection...");

  try {
    const conn = await connect();
    const dbName = conn.connection?.name || "luxora_pg";
    const host = conn.connection?.host || "cluster";
    console.log(`   ✅ MongoDB Connected Successfully! [Cluster: ${host} | DB: ${dbName}]`);
  } catch (err: any) {
    console.error("   ❌ MongoDB Connection Failed on Startup!");
    console.error(`      Error: ${err?.message || err}`);
    console.error("   💡 Troubleshooting:");
    console.error("      1. Verify MongoDB Atlas Network Access (IP Whitelist / 0.0.0.0/0).");
    console.error("      2. Verify database username and password in .env.");
    console.error("      3. Check your internet connection.");
  }
  console.log("=".repeat(72) + "\n");
}
