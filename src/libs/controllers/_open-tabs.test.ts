import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { storage, tabs } from "webextension-polyfill";
import { openPinnedTabs } from "./_open-tabs";

beforeEach(() => {
  storage.sync.get = vi.fn().mockResolvedValue({
    "pinned-tabs": ["https://www.gaunt.dev", "http://www.gaunt.dev"],
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("openPinnedTabs", () => {
  test("opens each url in the window", async () => {
    tabs.create = vi.fn().mockResolvedValue({ id: 2, windowId: 1 });

    await openPinnedTabs(1);

    expect(tabs.create).toHaveBeenCalledTimes(2);
    expect(tabs.remove).not.toHaveBeenCalled();
  });

  test("removes tab and stops if opened in another window", async () => {
    tabs.create = vi.fn().mockResolvedValue({ id: 2, windowId: 3 });

    await openPinnedTabs(1);

    expect(tabs.create).toHaveBeenCalledTimes(1);
    expect(tabs.remove).toHaveBeenCalledWith(2);
  });
});
