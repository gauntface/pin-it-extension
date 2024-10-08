import { storage } from "webextension-polyfill";

export const URLS_TO_PIN_STORAGE_KEY = "pinned-tabs";

export async function getUrlsToPin(): Promise<string[]> {
  const result = await storage.sync.get(URLS_TO_PIN_STORAGE_KEY);
  if (result[URLS_TO_PIN_STORAGE_KEY]) {
    return result[URLS_TO_PIN_STORAGE_KEY] as string[];
  }

  return [];
}

export async function setUrlsToPin(urls: string[]): Promise<void> {
  urls = urls
    .map((u) => {
      try {
        return new URL(u).toString();
      } catch (_e) {
        return "";
      }
    })
    .filter((u) => u.trim().length > 0);
  await storage.sync.set({
    [URLS_TO_PIN_STORAGE_KEY]: urls,
  });
}
