export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "statusCode" in error
  );
}

export function getErrorMessages(error: ApiError): string[] {
  if (Array.isArray(error.message)) {
    return error.message;
  }
  return [error.message];
}
