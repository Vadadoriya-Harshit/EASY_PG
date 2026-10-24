import mongoose, { Schema, type Model } from "mongoose";

let cached: Promise<typeof mongoose> | null = (globalThis as any).__mongo ?? null;
let listenersInitialized = false;

function maskMongoUri(uri: string): string {
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, "$1****$3");
  } catch {
    return "mongodb://[protected]";
  }
}

function initConnectionListeners() {
  if (listenersInitialized) return;
  listenersInitialized = true;

  mongoose.connection.on("connected", () => {
    console.log(`[MongoDB] 🟢 Connection active: ${mongoose.connection.host || "cluster"}/${mongoose.connection.name || ""}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] ⚠️  Connection disconnected.");
  });

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] 🔴 Runtime error:", err?.message || err);
  });
}

export async function connect() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.warn("[MongoDB] ⚠️  connect() called but MONGODB_URI is not set in environment.");
    throw new Error("MONGODB_URI is not set");
  }

  initConnectionListeners();

  if (mongoose.connection.readyState === 1) return mongoose;

  if (!cached) {
    const masked = maskMongoUri(uri);
    console.log(`[MongoDB] ⏳ Connecting to: ${masked}...`);

    cached = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 7000,
        socketTimeoutMS: 15000,
      })
      .then((m) => {
        console.log(`[MongoDB] ✅ Connected successfully to database: ${m.connection.name || "default"}`);
        return m;
      })
      .catch((err) => {
        cached = null;
        (globalThis as any).__mongo = null;
        console.error(`[MongoDB] ❌ Connection failed to ${masked}`);
        console.error(`[MongoDB] Error: ${err?.message || err}`);
        throw err;
      });
    (globalThis as any).__mongo = cached;
  }
  return cached;
}

/** Documents are validated with Zod at the API boundary; schemas stay flexible for embedded arrays. */
function make(name: string, collection: string, indexes: Record<string, 1 | -1>[] = []): Model<any> {
  if (mongoose.models[name]) return mongoose.models[name] as Model<any>;
  const schema = new Schema({}, { strict: false, versionKey: false });
  indexes.forEach((i) => schema.index(i, { unique: Object.keys(i)[0] === "slug" || Object.keys(i)[0] === "id" }));
  return mongoose.model(name, schema, collection);
}

export const PropertyModel = () => make("Property", "properties", [{ slug: 1 }]);
export const AreaModel = () => make("Area", "areas", [{ slug: 1 }]);
export const InquiryModel = () => make("Inquiry", "inquiries", [{ id: 1 }]);
export const EventModel = () => make("Event", "events", []);
export const CmsModel = () => make("Cms", "cms", [{ key: 1 }]);
export const AdminUserModel = () => make("AdminUser", "admin_users", [{ email: 1 }]);
export const VacancyModel = () => make("VacancySubscription", "vacancy_subscriptions", [{ id: 1 }, { contact: 1 }]);
