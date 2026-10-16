import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { AreaModel, PropertyModel, CmsModel, connect } from "../src/lib/models";
import { sampleAreas, sampleProperties } from "../src/lib/sample-data";
import { DEFAULT_CMS_DATA } from "../src/lib/cms-store";

// Auto-load .env.local or .env if present
for (const envFile of [".env.local", ".env"]) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

async function main() {
  console.log("==================================================");
  console.log("🚀 LUXORA PG - MONGODB ATLAS SEED & EXPORT ENGINE");
  console.log("==================================================");

  // 1. Export JSON and Mongo Shell queries to disk for Atlas Web Console / Compass
  const exportDir = path.join(process.cwd(), "data-export");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Export Areas JSON
  fs.writeFileSync(
    path.join(exportDir, "areas.json"),
    JSON.stringify(sampleAreas, null, 2),
    "utf-8"
  );

  // Export Properties JSON
  fs.writeFileSync(
    path.join(exportDir, "properties.json"),
    JSON.stringify(sampleProperties, null, 2),
    "utf-8"
  );

  // Export CMS JSON
  const cmsDoc = { key: "site_cms", ...DEFAULT_CMS_DATA };
  fs.writeFileSync(
    path.join(exportDir, "cms.json"),
    JSON.stringify([cmsDoc], null, 2),
    "utf-8"
  );

  // Generate 1-Click MongoDB Atlas Shell Queries (mongosh script)
  const atlasScript = `/**
 * =========================================================================
 * MONGODB ATLAS 1-CLICK SEED SCRIPT (MONGOSH / ATLAS WEB SHELL)
 * Copy & Paste this entire script into MongoDB Atlas Web Shell or Compass.
 * =========================================================================
 */

// 1. Ensure collection indexes
db.areas.createIndex({ slug: 1 }, { unique: true });
db.properties.createIndex({ slug: 1 }, { unique: true });
db.cms.createIndex({ key: 1 }, { unique: true });
db.inquiries.createIndex({ id: 1 }, { unique: true });

// 2. Insert Areas
print("Seeding areas...");
const areas = ${JSON.stringify(sampleAreas, null, 2)};
for (const a of areas) {
  db.areas.updateOne({ slug: a.slug }, { $set: a }, { upsert: true });
}

// 3. Insert Properties
print("Seeding properties...");
const properties = ${JSON.stringify(sampleProperties, null, 2)};
for (const p of properties) {
  db.properties.updateOne({ slug: p.slug }, { $set: p }, { upsert: true });
}

// 4. Insert Site CMS
print("Seeding site CMS content...");
const cms = ${JSON.stringify(cmsDoc, null, 2)};
db.cms.updateOne({ key: "site_cms" }, { $set: cms }, { upsert: true });

print("✅ MongoDB Atlas Seed Completed Successfully!");
print("Total Areas: " + db.areas.countDocuments());
print("Total Properties: " + db.properties.countDocuments());
print("Total CMS Documents: " + db.cms.countDocuments());
`;

  fs.writeFileSync(
    path.join(exportDir, "mongodb-atlas-queries.js"),
    atlasScript,
    "utf-8"
  );

  console.log("📁 Offline Data Exports Generated in: /data-export/");
  console.log("   - data-export/areas.json");
  console.log("   - data-export/properties.json");
  console.log("   - data-export/cms.json");
  console.log("   - data-export/mongodb-atlas-queries.js");

  // 2. If MONGODB_URI is provided, connect and seed directly into Atlas
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("\n⚠️  Notice: MONGODB_URI is not set in environment or .env.local.");
    console.log("   To seed your live MongoDB Atlas cluster automatically:");
    console.log("   1. Add your Atlas connection string to .env.local:");
    console.log("      MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sorath_pg?retryWrites=true&w=majority");
    console.log("   2. Run: npm run seed");
    console.log("\n   OR you can copy 'data-export/mongodb-atlas-queries.js' and paste it directly into MongoDB Compass / Atlas Web Shell!");
    return;
  }

  console.log("\n🔗 Connecting to MongoDB Atlas cluster...");
  await connect();
  console.log("✅ Connected successfully!");

  console.log("📥 Seeding areas into MongoDB Atlas...");
  for (const a of sampleAreas) {
    await AreaModel().findOneAndUpdate({ slug: a.slug }, a, { upsert: true });
  }

  console.log("📥 Seeding properties into MongoDB Atlas...");
  for (const p of sampleProperties) {
    await PropertyModel().findOneAndUpdate({ slug: p.slug }, p, { upsert: true });
  }

  console.log("📥 Seeding visual CMS into MongoDB Atlas...");
  await CmsModel().findOneAndUpdate({ key: "site_cms" }, cmsDoc, { upsert: true });

  console.log("\n🎉 ALL COLLECTIONS SEEDED IN MONGODB ATLAS:");
  console.log(`   - 'areas' collection: ${sampleAreas.length} localities (Satellite, Vastrapur, Navrangpura, Thaltej)`);
  console.log(`   - 'properties' collection: ${sampleProperties.length} verified PG residences`);
  console.log(`   - 'cms' collection: 1 centralized site CMS document (Hero, Contact, Ticker, About)`);
  console.log("==================================================");

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("❌ Seed Error:", e);
  process.exit(1);
});

