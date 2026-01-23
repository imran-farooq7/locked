export const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T) =>
    fns.reduce((acc, fn) => fn(acc), value);

export const compose =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T) =>
    fns.reduceRight((acc, fn) => fn(acc), value);

// Immutable updates
export const updateObject = <T extends Record<string, any>>(
  obj: T,
  updates: Partial<T>,
): T => ({ ...obj, ...updates });

// Result type for error handling
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const success = <T>(data: T): Result<T> => ({ success: true, data });
export const failure = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

// Async result wrapper
export const tryCatch = async <T>(
  fn: () => Promise<T>,
  errorMessage?: string,
): Promise<Result<T>> => {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error
        : new Error(errorMessage || "Unknown error"),
    );
  }
};
