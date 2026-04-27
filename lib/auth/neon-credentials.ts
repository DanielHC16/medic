import { neonAuth } from "@/lib/auth/neon";
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
    "Neon Auth rejected the request."
  );
}

function getNeonAuthUserId(result: unknown) {
  const data = getNestedObject(result, "data");
  const user = getNestedObject(data, "user");
  const sessionUser = getNestedObject(getNestedObject(data, "session"), "user");

  return (
    getNestedString(user, "id") ||
    getNestedString(sessionUser, "id") ||
    getNestedString(data, "id") ||
    getNestedString(result, "id")
  );
}

async function signUpNeonUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<NeonAuthResult> {
  const result = await neonAuth.signUp.email({
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
  const result = await neonAuth.signIn.email({
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
