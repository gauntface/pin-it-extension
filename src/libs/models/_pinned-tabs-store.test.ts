import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as browserStorage from "./_pinned-tabs-browser-storage";
import { PinnedTabsStore } from "./_pinned-tabs-store";

vi.mock("./_pinned-tabs-browser-storage");

describe("PinnedTabsStore", () => {
  let store: PinnedTabsStore;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(browserStorage.getUrlsToPin).mockResolvedValue([]);
    store = new PinnedTabsStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test("initializes with empty array", async () => {
    const subscriber = vi.fn();
    store.subscribe(subscriber);

    await vi.runAllTimersAsync();

    expect(subscriber).toHaveBeenCalledWith({
      urls: [""],
      pendingChanges: false,
    });
  });

  test("saves URLs and notifies subscribers", async () => {
    const subscriber = vi.fn();
    store.subscribe(subscriber);

    store.saveURLs(["https://example.com"]);

    expect(subscriber).toHaveBeenCalledWith({
      urls: ["https://example.com"],
      pendingChanges: true,
    });

    await vi.advanceTimersByTimeAsync(1000);

    expect(browserStorage.setUrlsToPin).toHaveBeenCalledWith([
      "https://example.com",
    ]);
    expect(subscriber).toHaveBeenCalledWith({
      urls: ["https://example.com"],
      pendingChanges: false,
    });
  });

  test("debounces multiple saveURLs calls", async () => {
    store.saveURLs(["https://example1.com"]);
    store.saveURLs(["https://example2.com"]);
    store.saveURLs(["https://example3.com"]);

    await vi.advanceTimersByTimeAsync(1000);

    expect(browserStorage.setUrlsToPin).toHaveBeenCalledTimes(1);
    expect(browserStorage.setUrlsToPin).toHaveBeenCalledWith([
      "https://example3.com",
    ]);
  });

  test("cancels pending save", async () => {
    const subscriber = vi.fn();
    store.subscribe(subscriber);

    store.saveURLs(["https://example.com"]);
    store.cancelSave();

    await vi.advanceTimersByTimeAsync(1000);

    expect(browserStorage.setUrlsToPin).not.toHaveBeenCalled();
    expect(subscriber).toHaveBeenCalledWith({
      urls: ["https://example.com"],
      pendingChanges: true,
    });
  });

  test("handles unsubscribe correctly", () => {
    const subscriber = vi.fn();
    const unsubscribe = store.subscribe(subscriber);

    unsubscribe();
    store.saveURLs(["https://example.com"]);

    expect(subscriber).toHaveBeenCalledTimes(1); // Only the initial call
  });
});
