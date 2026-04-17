import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import type { SessionUser } from "@/lib/medic-types";

const SESSION_COOKIE_NAME = "medic_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = SessionUser & {
  exp: number;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET || "medic-development-session-secret";
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const serialized = toBase64Url(JSON.stringify(payload));
  const signature = signValue(serialized);

  return `${serialized}.${signature}`;
}

function decodeSession(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [serialized, signature] = token.split(".");

  if (!serialized || !signature) {
    return null;
  }

  const expectedSignature = signValue(serialized);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  const payload = JSON.parse(fromBase64Url(serialized)) as SessionPayload;

  if (Date.now() > payload.exp) {
    return null;
  }

  return payload;
}

export async function createUserSession(user: SessionUser) {
  const payload: SessionPayload = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    userId: user.userId,
    exp: Date.now() + SESSION_DURATION_SECONDS * 1000,
  };
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(payload), {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function readUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = decodeSession(token);

  if (!payload) {
    return null;
  }

  const { exp, ...user } = payload;
  void exp;
  return user;
}
