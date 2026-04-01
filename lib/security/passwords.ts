import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return {
    hash,
    salt,
  };
}

export function verifyPassword(options: {
  password: string;
  storedHash: string | null;
  storedSalt: string | null;
}) {
  if (!options.storedHash || !options.storedSalt) {
    return false;
  }

  const derivedHash = scryptSync(options.password, options.storedSalt, 64);
  const storedHashBuffer = Buffer.from(options.storedHash, "hex");

  if (derivedHash.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedHash, storedHashBuffer);
}
