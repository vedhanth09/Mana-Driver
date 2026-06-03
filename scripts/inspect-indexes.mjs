import "dotenv/config";
import fs from "node:fs";
import mongoose from "mongoose";

// Load .env.local manually (Next.js convention, not picked up by dotenv default)
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) {
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI not set");

await mongoose.connect(uri, { bufferCommands: false });
const coll = mongoose.connection.db.collection("users");

const indexes = await coll.indexes();
console.log("=== INDEXES on users ===");
for (const idx of indexes) {
  console.log(JSON.stringify({ name: idx.name, key: idx.key, unique: idx.unique ?? false, sparse: idx.sparse ?? false }));
}

console.log("\n=== Null/missing field counts ===");
console.log("phone null:", await coll.countDocuments({ phone: null }));
console.log("googleId null:", await coll.countDocuments({ googleId: null }));
console.log("total users:", await coll.countDocuments({}));

await mongoose.disconnect();
