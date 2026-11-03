import * as browser from "webextension-polyfill";
import { getUrlsToPin } from "../models/_pinned-tabs-browser-storage";
import { logger } from "../utils/_logger";
import { retryWithBackoff } from "../utils/_retry";

// Chrome (and occasionally Firefox) can reject a tab edit with "Tabs
// cannot be edited right now" while the tab strip is transiently busy -
// this isn't limited to a literal user drag, it can also happen when we
// issue our own edits in quick succession. Retry the single failing call
// rather than redoing the whole close+open batch.
const TAB_EDIT_RETRY_OPTS = {
  maxAttempts: 6,
  initialDelayMs: 50,
  maxDelayMs: 800,
};

type TabWithID = browser.Tabs.Tab & { id: number };

/**
 * We sync tabs to ensure at least 1 tab is open in the window.
 * @param windowID
 */
export async function syncPinnedTabs(windowID: number): Promise<void> {
  logger.log(`Syncing tabs in window ${windowID}`);

  const urlsToPin = await getUrlsToPin();
  const existingPinnedTabs = await browser.tabs.query({
    pinned: true,
    windowId: windowID,
  });
  const pinsToSync = existingPinnedTabs.filter((t, i): t is TabWithID => {
    if (t.audible) {
      logger.debug(`Keeping tab ${i} because it's playing sound`);
      return false;
    }
    if (!t.id) {
      logger.debug(`Skipping tab ${i} because it has no ID`);
      return false;
    }
    return true;
  });
  const toReplace = pinsToSync.slice(0, urlsToPin.length);
  const toRemove = pinsToSync.slice(urlsToPin.length);

  logger.debug(`Tabs to replace and to remove`, { toReplace, toRemove });

  for (const [i, u] of urlsToPin.entries()) {
    if (i < toReplace.length) {
      await replaceTab(toReplace[i].id, u);
    } else {
      await createTab(windowID, u);
    }
  }

  if (toRemove.length > 0) {
    logger.debug(`Removing tabs:`, toRemove);
    await removeTabs(toRemove.map((t) => t.id));
  }
}

async function replaceTab(tabID: number, url: string) {
  await retryWithBackoff(
    () => browser.tabs.update(tabID, { url }),
    TAB_EDIT_RETRY_OPTS,
  );
}

async function createTab(windowID: number, url: string) {
  await retryWithBackoff(
    () =>
      browser.tabs.create({
        // Don't force focus on it.
        active: false,
        // Ensure it's pinned
        pinned: true,
        // Provide URL of the tab
        url,
        // The window to open the tabs in
        windowId: windowID,
      }),
    TAB_EDIT_RETRY_OPTS,
  );
}

async function removeTabs(tabIDs: Array<number>) {
  await retryWithBackoff(
    () => browser.tabs.remove(tabIDs),
    TAB_EDIT_RETRY_OPTS,
  );
}
