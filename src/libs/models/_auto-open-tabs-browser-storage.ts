import * as browser from "webextension-polyfill";

export const AUTO_OPEN_STORAGE_KEY = "auto-open-tabs";

export async function getAutoOpenTabs(): Promise<AutoOpenTabs> {
  const result = await browser.storage.sync.get(AUTO_OPEN_STORAGE_KEY);
  if (result[AUTO_OPEN_STORAGE_KEY]) {
    return result[AUTO_OPEN_STORAGE_KEY];
  }

  return {
    autoOpenTabsNewWindow: false,
  };
}

export async function setAutoOpenTabs(autoOpen: AutoOpenTabs): Promise<void> {
  await browser.storage.sync.set({
    [AUTO_OPEN_STORAGE_KEY]: autoOpen,
  });
}

interface AutoOpenTabs {
  autoOpenTabsNewWindow: boolean;
}
