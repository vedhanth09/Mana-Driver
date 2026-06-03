import fs from "node:fs";
import mongoose from "mongoose";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) {
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

await mongoose.connect(process.env.MONGO_URI, { bufferCommands: false });
const coll = mongoose.connection.db.collection("users");

// Distinguish field-absent vs explicit null
const absent = await coll.countDocuments({ phone: { $exists: false } });
const explicitNull = await coll.countDocuments({ phone: { $type: "null" } });
console.log(`phone absent: ${absent}, phone explicit null: ${explicitNull}`);

if (explicitNull > 0) {
  // Sparse won't help with explicit null — unset them so they fall out of a sparse index.
  const res = await coll.updateMany({ phone: { $type: "null" } }, { $unset: { phone: "" } });
  console.log(`Unset explicit-null phone on ${res.modifiedCount} docs`);
}

console.log("Dropping phone_1 ...");
try {
  await coll.dropIndex("phone_1");
  console.log("Dropped phone_1");
} catch (e) {
  console.log("dropIndex note:", e.message);
}

console.log("Recreating phone_1 as { unique: true, sparse: true } ...");
await coll.createIndex({ phone: 1 }, { unique: true, sparse: true, name: "phone_1" });
console.log("Recreated.");

console.log("\n=== INDEXES now ===");
for (const idx of await coll.indexes()) {
  console.log(JSON.stringify({ name: idx.name, key: idx.key, unique: idx.unique ?? false, sparse: idx.sparse ?? false }));
}

await mongoose.disconnect();
