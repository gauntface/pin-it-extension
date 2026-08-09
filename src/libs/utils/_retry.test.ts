import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { retryWithBackoff } from "./_retry";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("resolves on the first attempt without waiting", async () => {
  const fn = vi.fn().mockResolvedValue("ok");

  const result = await retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelayMs: 50,
    maxDelayMs: 200,
  });

  expect(result).toBe("ok");
  expect(fn).toHaveBeenCalledTimes(1);
});

test("retries with exponential backoff until it succeeds", async () => {
  const fn = vi
    .fn()
    .mockRejectedValueOnce(new Error("Tabs cannot be edited right now"))
    .mockRejectedValueOnce(new Error("Tabs cannot be edited right now"))
    .mockResolvedValue("ok");

  const promise = retryWithBackoff(fn, {
    maxAttempts: 5,
    initialDelayMs: 50,
    maxDelayMs: 200,
  });

  await vi.advanceTimersByTimeAsync(50); // 1st retry, after 50ms
  await vi.advanceTimersByTimeAsync(100); // 2nd retry, after 100ms (doubled)

  await expect(promise).resolves.toBe("ok");
  expect(fn).toHaveBeenCalledTimes(3);
});

test("caps the delay at maxDelayMs", async () => {
  const fn = vi
    .fn()
    .mockRejectedValueOnce(new Error("fail"))
    .mockRejectedValueOnce(new Error("fail"))
    .mockRejectedValueOnce(new Error("fail"))
    .mockResolvedValue("ok");

  const promise = retryWithBackoff(fn, {
    maxAttempts: 5,
    initialDelayMs: 50,
    maxDelayMs: 60,
  });

  await vi.advanceTimersByTimeAsync(50); // 1st retry, after 50ms
  await vi.advanceTimersByTimeAsync(60); // 2nd retry, after 60ms (capped)
  await vi.advanceTimersByTimeAsync(60); // 3rd retry, after 60ms (capped)

  await expect(promise).resolves.toBe("ok");
  expect(fn).toHaveBeenCalledTimes(4);
});

test("rethrows the last error once maxAttempts is exhausted", async () => {
  const err = new Error("Tabs cannot be edited right now");
  const fn = vi.fn().mockRejectedValue(err);

  const promise = retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelayMs: 10,
    maxDelayMs: 100,
  });
  const assertion = expect(promise).rejects.toBe(err);

  await vi.advanceTimersByTimeAsync(10);
  await vi.advanceTimersByTimeAsync(20);

  await assertion;
  expect(fn).toHaveBeenCalledTimes(3);
});
