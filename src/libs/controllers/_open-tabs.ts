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

/**
 * Opens the configured pins in the window and returns the IDs of the new
 * tabs.
 *
 * @param {number} windowID
 */
export async function openPinnedTabs(windowID: number): Promise<Set<number>> {
  logger.log(`Opening tabs in window ${windowID}`);

  const urlsToPin = await getUrlsToPin();
  const newTabIDs = new Set<number>();

  for (const u of urlsToPin) {
    logger.debug(`Creating tab for ${u}`);
    const tab = await retryWithBackoff(
      () =>
        browser.tabs.create({
          // Don't force focus on it.
          active: false,
          // Ensure it's pinned
          pinned: true,
          // Provide URL of the tab
          url: u,
          // The window to open the tabs in
          windowId: windowID,
        }),
      TAB_EDIT_RETRY_OPTS,
    );
    if (tab.id !== undefined) {
      newTabIDs.add(tab.id);
    }
  }
  return newTabIDs;
}

/**
 * Closes the pinned tabs in the window, except for `keepTabIDs` and any
 * tab playing sound.
 *
 * @param {number} windowID
 * @param {Set<number>} keepTabIDs
 */
export async function closePinnedTabs(
  windowID: number,
  keepTabIDs: Set<number>,
) {
  const tabs = await browser.tabs.query({
    pinned: true,
    windowId: windowID,
  });
  const tabsToClose: Array<number> = [];
  for (let i = 0; i < tabs.length; i++) {
    const t = tabs[i];
    if (t.audible) {
      logger.debug(`Keeping tab ${i} because it's playing sound`);
      continue;
    }
    if (!t.id) {
      logger.debug(`Skipping tab ${i} because it has no ID`);
      continue;
    }
    if (keepTabIDs.has(t.id)) {
      continue;
    }
    tabsToClose.push(t.id);
  }
  logger.debug(`Removing tabs:`, tabsToClose);
  await retryWithBackoff(
    () => browser.tabs.remove(tabsToClose),
    TAB_EDIT_RETRY_OPTS,
  );
}
