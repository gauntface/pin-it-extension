import { sleep } from "./_sleep";

export interface RetryOptions {
  /** Maximum number of attempts, including the first. */
  maxAttempts: number;
  /** Delay before the first retry. */
  initialDelayMs: number;
  /** Upper bound the delay is capped at as it doubles each retry. */
  maxDelayMs: number;
}

/**
 * Retries `fn` with exponential backoff, rethrowing the last error once
 * `maxAttempts` is reached.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  let delayMs = opts.initialDelayMs;
  let attempt = 0;

  for (;;) {
    attempt++;
    try {
      return await fn();
    } catch (err) {
      if (attempt >= opts.maxAttempts) {
        throw err;
      }
      await sleep(delayMs);
      delayMs = Math.min(delayMs * 2, opts.maxDelayMs);
    }
  }
}
