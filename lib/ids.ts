import { randomInt, randomUUID } from "node:crypto";

export function createId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

export function createInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    const randomIndex = randomInt(0, alphabet.length);
    code += alphabet[randomIndex];
  }

  return code;
}
