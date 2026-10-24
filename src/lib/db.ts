import mongoose from "mongoose";
import { connect } from "./models";

/**
 * Minimal collection abstraction for security-sensitive and operational data
 * (OTPs, sessions, rate-limit counters, notification queue, audit log).
 *
 * - With MONGODB_URI: MongoDB via the native driver. Errors propagate (they are NOT silently swallowed).
 * - Without it (local demo): an in-process store with the same semantics for the operators used here.
 *
 * Supported filter operators: equality, $in, $ne, $lt, $lte, $gt, $gte. Updates: $set, $inc, $unset, $setOnInsert.
 */
export type Doc = Record<string, any>;
export type Filter = Record<string, any>;
export interface Update { $set?: Doc; $inc?: Doc; $unset?: Doc; $setOnInsert?: Doc }
export interface FindOpts { sort?: Record<string, 1 | -1>; limit?: number; skip?: number }

export class DuplicateKeyError extends Error {
  constructor(msg = "Duplicate key") { super(msg); this.name = "DuplicateKeyError"; }
}

export interface Col {
  findOne(f: Filter): Promise<Doc | null>;
  find(f?: Filter, o?: FindOpts): Promise<Doc[]>;
  insertOne(d: Doc): Promise<void>;
  updateOne(f: Filter, u: Update, o?: { upsert?: boolean }): Promise<Doc | null>;
  deleteOne(f: Filter): Promise<number>;
  deleteMany(f: Filter): Promise<number>;
  count(f?: Filter): Promise<number>;
}

export interface ColOpts {
  /** Fields that must be unique (each field individually). */
  unique?: string[];
  /** Non-unique indexes. */
  indexes?: string[];
  /** Date field that expires the document (TTL). */
  ttl?: string;
}

export const hasDb = () => !!process.env.MONGODB_URI;

// ---------------------------------------------------------------- in-memory
const g = globalThis as any;
const memStore = (): Map<string, Doc[]> => (g.__sorathCols ??= new Map<string, Doc[]>());

const val = (v: any) => (v instanceof Date ? v.getTime() : v);

function matches(doc: Doc, f: Filter): boolean {
  for (const [k, cond] of Object.entries(f)) {
    const dv = doc[k];
    if (cond && typeof cond === "object" && !(cond instanceof Date) && !Array.isArray(cond)) {
      for (const [op, ov] of Object.entries(cond as Doc)) {
        const a = val(dv), b = val(ov);
        if (op === "$in") { if (!(ov as any[]).map(val).includes(a)) return false; }
        else if (op === "$ne") { if (a === b) return false; }
        else if (op === "$lt") { if (!(a < b)) return false; }
        else if (op === "$lte") { if (!(a <= b)) return false; }
        else if (op === "$gt") { if (!(a > b)) return false; }
        else if (op === "$gte") { if (!(a >= b)) return false; }
        else throw new Error(`Unsupported operator ${op}`);
      }
    } else if (val(dv) !== val(cond)) return false;
  }
  return true;
}

function applyUpdate(doc: Doc, u: Update) {
  if (u.$set) Object.assign(doc, u.$set);
  if (u.$inc) for (const [k, n] of Object.entries(u.$inc)) doc[k] = (Number(doc[k]) || 0) + Number(n);
  if (u.$unset) for (const k of Object.keys(u.$unset)) delete doc[k];
}

function memCol(name: string, opts: ColOpts): Col {
  const rows = () => {
    const m = memStore();
    let arr = m.get(name);
    if (!arr) { arr = []; m.set(name, arr); }
    if (opts.ttl) {
      const now = Date.now();
      const kept = arr.filter((d) => !d[opts.ttl!] || val(d[opts.ttl!]) > now);
      if (kept.length !== arr.length) { m.set(name, kept); arr = kept; }
    }
    return arr;
  };
  const clone = <T,>(d: T): T => structuredClone(d);
  const sorted = (arr: Doc[], o?: FindOpts) => {
    let out = [...arr];
    if (o?.sort) {
      const entries = Object.entries(o.sort);
      out.sort((a, b) => {
        for (const [k, dir] of entries) {
          const x = val(a[k]), y = val(b[k]);
          if (x === y) continue;
          return (x > y ? 1 : -1) * dir;
        }
        return 0;
      });
    }
    if (o?.skip) out = out.slice(o.skip);
    if (o?.limit) out = out.slice(0, o.limit);
    return out;
  };
  return {
    async findOne(f) { const d = rows().find((x) => matches(x, f)); return d ? clone(d) : null; },
    async find(f = {}, o) { return sorted(rows().filter((x) => matches(x, f)), o).map(clone); },
    async insertOne(d) {
      const arr = rows();
      for (const u of opts.unique || []) {
        if (d[u] !== undefined && arr.some((x) => val(x[u]) === val(d[u]))) throw new DuplicateKeyError(`Duplicate ${u}`);
      }
      arr.push(clone(d));
    },
    async updateOne(f, u, o) {
      const arr = rows();
      const d = arr.find((x) => matches(x, f));
      if (d) { applyUpdate(d, u); return clone(d); }
      if (!o?.upsert) return null;
      const base: Doc = {};
      for (const [k, v] of Object.entries(f)) if (!(v && typeof v === "object" && !(v instanceof Date))) base[k] = v;
      const nd = { ...base, ...(u.$setOnInsert || {}) };
      applyUpdate(nd, u);
      arr.push(nd);
      return clone(nd);
    },
    async deleteOne(f) {
      const arr = rows(); const i = arr.findIndex((x) => matches(x, f));
      if (i < 0) return 0; arr.splice(i, 1); return 1;
    },
    async deleteMany(f) {
      const m = memStore(); const arr = rows();
      const kept = arr.filter((x) => !matches(x, f));
      m.set(name, kept);
      return arr.length - kept.length;
    },
    async count(f = {}) { return rows().filter((x) => matches(x, f)).length; },
  };
}

// ---------------------------------------------------------------- mongo
const indexed: Set<string> = (g.__sorathIndexed ??= new Set<string>());

function mongoCol(name: string, opts: ColOpts): Col {
  const col = async () => {
    await connect();
    const c = mongoose.connection.collection(name);
    if (!indexed.has(name)) {
      indexed.add(name);
      try {
        for (const u of opts.unique || []) await c.createIndex({ [u]: 1 }, { unique: true, sparse: true });
        for (const i of opts.indexes || []) await c.createIndex({ [i]: 1 });
        if (opts.ttl) await c.createIndex({ [opts.ttl]: 1 }, { expireAfterSeconds: 0 });
      } catch (e) {
        indexed.delete(name);
        console.error(`[db] index creation failed for ${name}`);
      }
    }
    return c;
  };
  const strip = (d: any): Doc | null => { if (!d) return null; const { _id, ...rest } = d; return rest; };
  return {
    async findOne(f) { return strip(await (await col()).findOne(f)); },
    async find(f = {}, o) {
      let cur = (await col()).find(f);
      if (o?.sort) cur = cur.sort(o.sort as any);
      if (o?.skip) cur = cur.skip(o.skip);
      if (o?.limit) cur = cur.limit(o.limit);
      return (await cur.toArray()).map((d) => strip(d)!);
    },
    async insertOne(d) {
      try { await (await col()).insertOne({ ...d }); }
      catch (e: any) { if (e?.code === 11000) throw new DuplicateKeyError(); throw e; }
    },
    async updateOne(f, u, o) {
      const r = await (await col()).findOneAndUpdate(f, u as any, { upsert: !!o?.upsert, returnDocument: "after" });
      return strip(r);
    },
    async deleteOne(f) { return (await (await col()).deleteOne(f)).deletedCount; },
    async deleteMany(f) { return (await (await col()).deleteMany(f)).deletedCount; },
    async count(f = {}) { return (await col()).countDocuments(f); },
  };
}

const cache = new Map<string, Col>();
export function collection(name: string, opts: ColOpts = {}): Col {
  // `hasDb()` is evaluated on each call so switching env in tests works; wrappers are cheap.
  const key = `${hasDb() ? "m" : "x"}:${name}`;
  let c = cache.get(key);
  if (!c) { c = hasDb() ? mongoCol(name, opts) : memCol(name, opts); cache.set(key, c); }
  return c;
}

/** Test helper: wipe the in-memory store. */
export function __resetMemoryStore() { memStore().clear(); }
