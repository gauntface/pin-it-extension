import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { storage } from "webextension-polyfill";
import { getUrlsToPin, setUrlsToPin } from "./_pinned-tabs-browser-storage";

beforeEach(() => {});

afterEach(() => {
  vi.clearAllMocks();
});

describe("getUrlsToPin", () => {
  test("returns empty array for new storage", async () => {
    const urls = await getUrlsToPin();
    expect(urls).toEqual([]);
  });

  test("returns empty array from storage", async () => {
    storage.sync.get = vi.fn().mockResolvedValue({
      "pinned-tabs": [],
    });

    const urls = await getUrlsToPin();
    expect(urls).toEqual([]);
  });

  test("returns single url from storage", async () => {
    storage.sync.get = vi.fn().mockResolvedValue({
      "pinned-tabs": ["https://www.gaunt.dev"],
    });

    const urls = await getUrlsToPin();
    expect(urls).toEqual(["https://www.gaunt.dev"]);
  });

  test("returns multiple urls from storage", async () => {
    storage.sync.get = vi.fn().mockResolvedValue({
      "pinned-tabs": ["https://www.gaunt.dev", "http://www.gaunt.dev"],
    });

    const urls = await getUrlsToPin();
    expect(urls).toEqual(["https://www.gaunt.dev", "http://www.gaunt.dev"]);
  });
});

describe("setUrlsToPin", () => {
  test("saves empty array", async () => {
    await setUrlsToPin([]);
    expect(storage.sync.set).toHaveBeenCalledWith({
      "pinned-tabs": [],
    });
  });

  test("saves empty array for empty strings and invalid urls", async () => {
    await setUrlsToPin(["", "this is not a URL"]);
    expect(storage.sync.set).toHaveBeenCalledWith({
      "pinned-tabs": [],
    });
  });

  test("saves valid and normalized urls", async () => {
    await setUrlsToPin(["http://www.gaunt.dev", "https://gaunt.dev/projects"]);
    expect(storage.sync.set).toHaveBeenCalledWith({
      "pinned-tabs": ["http://www.gaunt.dev/", "https://gaunt.dev/projects"],
    });
  });
});
