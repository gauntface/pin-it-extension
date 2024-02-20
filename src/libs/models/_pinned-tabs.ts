import * as browser from "webextension-polyfill";

export const URLS_TO_PIN_STORAGE_KEY = "pinned-tabs";

export async function getUrlsToPin(): Promise<string[]> {
  const result = await browser.storage.sync.get(URLS_TO_PIN_STORAGE_KEY);
  if (result[URLS_TO_PIN_STORAGE_KEY]) {
    return result[URLS_TO_PIN_STORAGE_KEY];
  }

  return [];
}

export async function setUrlsToPin(urls: string[]): Promise<Array<string>> {
  urls = urls.map((u) => u.trim()).filter((u) => u.length > 0);
  await browser.storage.sync.set({
    [URLS_TO_PIN_STORAGE_KEY]: urls,
  });
  return urls;
}
