// lib/trap/generateTrapField.ts
import { createHmac } from "crypto";
import { redis } from "../limit";

export async function generateTrapField() {
  const timestamp = Date.now().toString();
  const secret = process.env.TRAP_SALT!;

  const hash = createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex")
    .slice(0, 8);

  const prefix = ["xuid", "xtok", "xcli"][Math.floor(Math.random() * 3)];
  const fieldName = `${prefix}_${timestamp}_${hash}`;

  // Store trap key in Redis for validation later
  await redis.set(`trap:${fieldName}`, "issued", { ex: 300 }); // 5 mins TTL

  return fieldName;
}
