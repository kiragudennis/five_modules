// lib/trap/validateTrapField.ts
import { createHmac } from "crypto";
import { redis } from "../limit";

export async function validateTrapField(trapKey: string) {
  const secret = process.env.TRAP_SALT!;
  if (!trapKey || trapKey.split("_").length !== 3) return false;

  const [_prefix, timestamp, hash] = trapKey.split("_");
  if (!timestamp || !hash) return false;

  // Recompute hash and validate
  const expectedHash = createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex")
    .slice(0, 8);

  if (hash !== expectedHash) return false;

  // Redis validation
  const key = `trap:${trapKey}`;
  const exists = await redis.get(key);
  if (!exists) return false;

  return true;
}
