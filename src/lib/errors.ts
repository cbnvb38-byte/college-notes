export class AppError extends Error {
  public status: number;
  public code: string;

  constructor(message: string, status: number = 400, code: string = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export function handleDatabaseError(error: any): never {
  // Log the raw database error internally for server diagnostic logging
  console.error("[Database Operations Failure]:", error);

  // Map database constraints to specific user-friendly messages if needed
  if (error && typeof error === "object") {
    const code = error.code;
    
    // Check standard Postgres constraint violation codes
    if (code === "23505") {
      throw new AppError("This record already exists in our system.", 409, "DUPLICATE_RECORD");
    }
    if (code === "23503") {
      throw new AppError("A related reference key could not be found.", 404, "REFERENCE_NOT_FOUND");
    }
    if (code === "42703") {
      throw new AppError("Unable to execute database request. Invalid attributes.", 500, "BAD_DATABASE_QUERY");
    }
  }

  // Generic fallback message: Never expose raw SQL or Postgres execution details to the user
  throw new AppError(
    "A database exception occurred. Our team has been notified. Please try again later.",
    500,
    "DATABASE_ERROR"
  );
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
      },
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: "INTERNAL_SERVER_ERROR",
        status: 500,
      },
    };
  }

  return {
    success: false,
    error: {
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
      status: 500,
    },
  };
}
