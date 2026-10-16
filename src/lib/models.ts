import mongoose, { Schema, type Model } from "mongoose";

let cached: Promise<typeof mongoose> | null = (globalThis as any).__mongo ?? null;

export async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!cached) {
    cached = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 7000,
        socketTimeoutMS: 15000,
      })
      .catch((err) => {
        cached = null;
        (globalThis as any).__mongo = null;
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
