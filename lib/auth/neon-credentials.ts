import { cookies, headers } from "next/headers";

import {
  findUserByEmailOrPhone,
  getUserById,
  getUserForAuth,
  linkUserAuthIdentity,
  markUserLogin,
  registerUser,
} from "@/lib/db/medic-data";
import type {
  AuthenticatedUser,
  InviteApprovalMode,
  RoleSlug,
} from "@/lib/medic-types";
import { getNeonAuthBaseUrl } from "@/lib/env";
import { verifyPassword } from "@/lib/security/passwords";

type RegisterWithNeonInput = {
  approvalMode?: InviteApprovalMode;
  assistanceLevel?: string;
  dateOfBirth?: string;
  email: string;
  emergencyNotes?: string;
  firstName: string;
  inviteCode?: string;
  lastName: string;
  password: string;
  phone?: string | null;
  role: RoleSlug;
};

type NeonAuthResult = {
  authUserId: string | null;
};

function readObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getNestedObject(value: unknown, key: string) {
  return readObject(value)?.[key];
}

function getNestedString(value: unknown, key: string) {
  const nestedValue = readObject(value)?.[key];
  return typeof nestedValue === "string" && nestedValue.trim() ? nestedValue.trim() : null;
}

function getNeonAuthErrorMessage(result: unknown) {
  const error = getNestedObject(result, "error");

  if (!error) {
    return null;
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    getNestedString(error, "message") ||
    getNestedString(error, "statusText") ||
    getNestedString(result, "message") ||
    getNestedString(result, "statusText") ||
    "Neon Auth rejected the request."
  );
}

function getNeonAuthUserId(result: unknown) {
  const data = getNestedObject(result, "data");
  const user = getNestedObject(data, "user");
  const sessionUser = getNestedObject(getNestedObject(data, "session"), "user");
  const topLevelUser = getNestedObject(result, "user");
  const topLevelSessionUser = getNestedObject(getNestedObject(result, "session"), "user");

  return (
    getNestedString(user, "id") ||
    getNestedString(sessionUser, "id") ||
    getNestedString(topLevelUser, "id") ||
    getNestedString(topLevelSessionUser, "id") ||
    getNestedString(data, "id") ||
    getNestedString(result, "id")
  );
}

function getOriginFromUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

async function assertSameOriginAuthRequest() {
  const headerStore = await headers();
  const requestOrigin =
    getOriginFromUrl(headerStore.get("origin")) ||
    getOriginFromUrl(headerStore.get("referer"));

  if (!requestOrigin) {
    return;
  }

  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol =
    headerStore.get("x-forwarded-proto") ||
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
      ? "http"
      : "https");
  const expectedOrigin = host ? `${protocol}://${host}` : null;
  const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;

  if (
    requestOrigin !== expectedOrigin &&
    requestOrigin !== vercelOrigin
  ) {
    throw new Error("Invalid origin");
  }
}

function parseSetCookie(setCookieHeader: string) {
  const [nameAndValue, ...attributes] = setCookieHeader.split(";");
  const valueSeparatorIndex = nameAndValue.indexOf("=");

  if (valueSeparatorIndex <= 0) {
    return null;
  }

  const cookie = {
    name: nameAndValue.slice(0, valueSeparatorIndex).trim(),
    value: decodeURIComponent(nameAndValue.slice(valueSeparatorIndex + 1)),
    options: {
      httpOnly: true,
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    } as {
      httpOnly?: boolean;
      maxAge?: number;
      partitioned?: boolean;
      path?: string;
      sameSite?: "lax" | "none" | "strict";
      secure?: boolean;
    },
  };

  for (const rawAttribute of attributes) {
    const [rawName, rawValue] = rawAttribute.trim().split("=");
    const name = rawName.toLowerCase();

    if (name === "httponly") {
      cookie.options.httpOnly = true;
    } else if (name === "secure") {
      cookie.options.secure = true;
    } else if (name === "partitioned") {
      cookie.options.partitioned = true;
    } else if (name === "path" && rawValue) {
      cookie.options.path = rawValue;
    } else if (name === "max-age" && rawValue) {
      const maxAge = Number(rawValue);
      if (Number.isFinite(maxAge)) {
        cookie.options.maxAge = maxAge;
      }
    } else if (name === "samesite" && rawValue) {
      const sameSite = rawValue.toLowerCase();
      if (sameSite === "lax" || sameSite === "none" || sameSite === "strict") {
        cookie.options.sameSite = sameSite;
      }
    }
  }

  return cookie;
}

async function persistNeonAuthCookies(response: Response) {
  const setCookieHeaders =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter((value): value is string => Boolean(value));

  if (setCookieHeaders.length === 0) {
    return;
  }

  const cookieStore = await cookies();

  for (const setCookieHeader of setCookieHeaders) {
    const cookie = parseSetCookie(setCookieHeader);

    if (!cookie) {
      continue;
    }

    cookieStore.set(cookie.name, cookie.value, cookie.options);
  }
}

async function callNeonEmailAuthEndpoint(
  path: "sign-in/email" | "sign-up/email",
  body: Record<string, string>,
) {
  await assertSameOriginAuthRequest();

  const baseUrl = getNeonAuthBaseUrl();
  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Origin: new URL(baseUrl).origin,
      "x-neon-auth-proxy": "nextjs",
    },
    method: "POST",
  });
  const result: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getNeonAuthErrorMessage(result) || response.statusText);
  }

  await persistNeonAuthCookies(response);

  return result;
}

async function signUpNeonUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<NeonAuthResult> {
  const result = await callNeonEmailAuthEndpoint("sign-up/email", {
    email: input.email,
    name: input.name,
    password: input.password,
  });
  const errorMessage = getNeonAuthErrorMessage(result);

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  return {
    authUserId: getNeonAuthUserId(result),
  };
}

async function signInNeonUser(input: {
  email: string;
  password: string;
}): Promise<NeonAuthResult> {
  const result = await callNeonEmailAuthEndpoint("sign-in/email", {
    email: input.email,
    password: input.password,
  });
  const errorMessage = getNeonAuthErrorMessage(result);

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  return {
    authUserId: getNeonAuthUserId(result),
  };
}

export async function registerUserWithNeonAuth(input: RegisterWithNeonInput) {
  const existingUser = await findUserByEmailOrPhone({
    email: input.email,
    phone: input.phone,
  });

  if (existingUser) {
    throw new Error("An account with that email or phone already exists.");
  }

  const authResult = await signUpNeonUser({
    email: input.email,
    name: `${input.firstName} ${input.lastName}`,
    password: input.password,
  });

  return registerUser({
    approvalMode: input.approvalMode,
    assistanceLevel: input.assistanceLevel,
    authUserId: authResult.authUserId,
    dateOfBirth: input.dateOfBirth,
    email: input.email,
    emergencyNotes: input.emergencyNotes,
    firstName: input.firstName,
    inviteCode: input.inviteCode,
    lastName: input.lastName,
    password: input.password,
    phone: input.phone ?? undefined,
    role: input.role,
  });
}

export async function authenticateUserWithNeonAuth(input: {
  identifier: string;
  password: string;
}): Promise<AuthenticatedUser> {
  const authRow = await getUserForAuth(input.identifier);

  if (!authRow) {
    throw new Error("No account matched that email or phone.");
  }

  let authUserId = authRow.auth_user_id;

  try {
    const authResult = await signInNeonUser({
      email: authRow.email,
      password: input.password,
    });
    authUserId = authResult.authUserId ?? authUserId;
  } catch (error) {
    const hasLegacyPassword = verifyPassword({
      password: input.password,
      storedHash: authRow.password_hash,
      storedSalt: authRow.password_salt,
    });

    if (!hasLegacyPassword) {
      throw new Error(
        error instanceof Error ? error.message : "Incorrect password.",
      );
    }

    const authResult = await signUpNeonUser({
      email: authRow.email,
      name: `${authRow.first_name} ${authRow.last_name}`,
      password: input.password,
    });
    authUserId = authResult.authUserId ?? authUserId;
  }

  await linkUserAuthIdentity({
    authUserId,
    userId: authRow.user_id,
  });
  await markUserLogin(authRow.user_id);

  const user = await getUserById(authRow.user_id);

  if (!user) {
    throw new Error("Failed to load the signed-in account.");
  }

  return user;
}
