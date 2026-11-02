import { afterEach, describe, expect, test, vi } from "vitest";
import * as browser from "webextension-polyfill";
import * as pinnedTabsStorage from "../models/_pinned-tabs-browser-storage";
import { closePinnedTabs, openPinnedTabs } from "./_open-tabs";

vi.mock("../models/_pinned-tabs-browser-storage");

const WINDOW_ID = 1;

describe("open and close pinned tabs", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  test("opens new pins, then closes only the old ones", async () => {
    const calls: string[] = [];
    let nextID = 100;

    vi.mocked(pinnedTabsStorage.getUrlsToPin).mockResolvedValue([
      "https://a.example",
      "https://b.example",
    ]);
    vi.mocked(browser.tabs.create).mockImplementation(async (props) => {
      calls.push(`create ${props.url}`);
      return { id: nextID++ } as browser.Tabs.Tab;
    });
    vi.mocked(browser.tabs.query).mockResolvedValue([
      { id: 1 }, // old pin
      { id: 2, audible: true }, // old pin playing sound
      { id: 100 }, // new pin
      { id: 101 }, // new pin
    ] as browser.Tabs.Tab[]);
    vi.mocked(browser.tabs.remove).mockImplementation(async (ids) => {
      calls.push(`remove ${JSON.stringify(ids)}`);
    });

    const newTabIDs = await openPinnedTabs(WINDOW_ID);
    await closePinnedTabs(WINDOW_ID, newTabIDs);

    expect(newTabIDs).toEqual(new Set([100, 101]));
    expect(calls).toEqual([
      "create https://a.example",
      "create https://b.example",
      "remove [1]",
    ]);
  });
});
