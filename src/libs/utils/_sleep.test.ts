import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { sleep } from "./_sleep";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("sleep by set amount", () => {
  const promise = sleep(100);
  vi.advanceTimersByTime(100 + 1);
  expect(promise).resolves.toBeUndefined();
});
