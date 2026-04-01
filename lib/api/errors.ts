type ErrorWithCode = {
  code?: string;
  message?: string;
};

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ErrorWithCode).message === "string"
  ) {
    return (error as ErrorWithCode).message!;
  }

  return "Unknown error";
}

export function getErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as ErrorWithCode).code === "string"
  ) {
    return (error as ErrorWithCode).code!;
  }

  return undefined;
}

export function isMissingTableError(error: unknown) {
  return getErrorCode(error) === "42P01";
}
