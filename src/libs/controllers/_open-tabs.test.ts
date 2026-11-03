import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as browser from "webextension-polyfill";
import * as pinnedTabsStorage from "../models/_pinned-tabs-browser-storage";
import { syncPinnedTabs } from "./_open-tabs";

vi.mock("../models/_pinned-tabs-browser-storage");

const WINDOW_ID = 1;

describe("syncPinnedTabs", () => {
  let calls: string[];

  function givenPins(urls: string[]) {
    vi.mocked(pinnedTabsStorage.getUrlsToPin).mockResolvedValue(urls);
  }

  function givenPinnedTabs(tabs: Partial<browser.Tabs.Tab>[]) {
    vi.mocked(browser.tabs.query).mockResolvedValue(tabs as browser.Tabs.Tab[]);
  }

  beforeEach(() => {
    calls = [];
    let nextID = 100;

    vi.mocked(browser.tabs.create).mockImplementation(async (props) => {
      calls.push(`create ${props.url}`);
      return { id: nextID++, windowId: props.windowId } as browser.Tabs.Tab;
    });
    vi.mocked(browser.tabs.update).mockImplementation((async (
      id: number,
      props: browser.Tabs.UpdateUpdatePropertiesType,
    ) => {
      calls.push(`update ${id} ${props.url}`);
      return { id } as browser.Tabs.Tab;
    }) as typeof browser.tabs.update);
    vi.mocked(browser.tabs.remove).mockImplementation(async (ids) => {
      calls.push(`remove ${JSON.stringify(ids)}`);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  test("queries only the pinned tabs in the window", async () => {
    givenPins([]);
    givenPinnedTabs([]);

    await syncPinnedTabs(WINDOW_ID);

    expect(browser.tabs.query).toHaveBeenCalledWith({
      pinned: true,
      windowId: WINDOW_ID,
    });
  });

  test("updates each pinned tab when the counts are the same", async () => {
    givenPins(["https://a.example", "https://b.example"]);
    givenPinnedTabs([{ id: 1 }, { id: 2 }]);

    await syncPinnedTabs(WINDOW_ID);

    expect(calls).toEqual([
      "update 1 https://a.example",
      "update 2 https://b.example",
    ]);
  });

  test("creates tabs for the pins that have no existing tab", async () => {
    givenPins(["https://a.example", "https://b.example", "https://c.example"]);
    givenPinnedTabs([{ id: 1 }]);

    await syncPinnedTabs(WINDOW_ID);

    expect(calls).toEqual([
      "update 1 https://a.example",
      "create https://b.example",
      "create https://c.example",
    ]);
    expect(browser.tabs.create).toHaveBeenCalledWith({
      active: false,
      pinned: true,
      url: "https://b.example",
      windowId: WINDOW_ID,
    });
  });

  test("creates every tab when the window has no pinned tabs", async () => {
    givenPins(["https://a.example", "https://b.example"]);
    givenPinnedTabs([]);

    await syncPinnedTabs(WINDOW_ID);

    expect(calls).toEqual([
      "create https://a.example",
      "create https://b.example",
    ]);
  });

  test("removes the surplus tabs after all updates", async () => {
    givenPins(["https://a.example"]);
    givenPinnedTabs([{ id: 1 }, { id: 2 }, { id: 3 }]);

    await syncPinnedTabs(WINDOW_ID);

    expect(calls).toEqual(["update 1 https://a.example", "remove [2,3]"]);
  });

  test("removes every pinned tab when there are no pins", async () => {
    givenPins([]);
    givenPinnedTabs([{ id: 1 }, { id: 2 }]);

    await syncPinnedTabs(WINDOW_ID);

    expect(calls).toEqual(["remove [1,2]"]);
  });

  test("does nothing when there are no pins and no pinned tabs", async () => {
    givenPins([]);
    givenPinnedTabs([]);

    await syncPinnedTabs(WINDOW_ID);

    expect(calls).toEqual([]);
  });

  test("does not update or remove a tab that plays sound", async () => {
    givenPins(["https://a.example"]);
    givenPinnedTabs([{ id: 1, audible: true }, { id: 2 }, { id: 3 }]);

    await syncPinnedTabs(WINDOW_ID);

    expect(calls).toEqual(["update 2 https://a.example", "remove [3]"]);
  });

  test("creates a new tab when the only pinned tab plays sound", async () => {
    givenPins(["https://a.example"]);
    givenPinnedTabs([{ id: 1, audible: true }]);

    await syncPinnedTabs(WINDOW_ID);

    expect(calls).toEqual(["create https://a.example"]);
  });

  test("ignores a pinned tab that has no ID", async () => {
    givenPins(["https://a.example"]);
    givenPinnedTabs([{}, { id: 2 }]);

    await syncPinnedTabs(WINDOW_ID);

    expect(calls).toEqual(["update 2 https://a.example"]);
  });

  test("retries an update that fails", async () => {
    vi.useFakeTimers();
    givenPins(["https://a.example"]);
    givenPinnedTabs([{ id: 1 }]);
    vi.mocked(browser.tabs.update)
      .mockRejectedValueOnce(new Error("Tabs cannot be edited right now"))
      .mockResolvedValueOnce({ id: 1 } as browser.Tabs.Tab);

    const done = syncPinnedTabs(WINDOW_ID);
    await vi.advanceTimersByTimeAsync(50);
    await done;

    expect(browser.tabs.update).toHaveBeenCalledTimes(2);
  });

  test("stops and does not remove tabs when an update keeps failing", async () => {
    vi.useFakeTimers();
    givenPins(["https://a.example"]);
    givenPinnedTabs([{ id: 1 }, { id: 2 }]);
    vi.mocked(browser.tabs.update).mockRejectedValue(
      new Error("No tab with id: 1"),
    );

    const done = expect(syncPinnedTabs(WINDOW_ID)).rejects.toThrow(
      "No tab with id: 1",
    );
    await vi.runAllTimersAsync();
    await done;

    expect(browser.tabs.update).toHaveBeenCalledTimes(6);
    expect(browser.tabs.remove).not.toHaveBeenCalled();
  });
});
