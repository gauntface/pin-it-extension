import * as browser from 'webextension-polyfill';
import {logger} from '../utils/_logger';
import {getUrlsToPin} from '../../../src/libs/models/_pinned-tabs';

/**
 * @param {number} windowID
 */
export async function openPinnedTabs(windowID: number): Promise<void> {
  logger.log(`Opening tabs in window ${windowID}`);

  const urlsToPin = await getUrlsToPin();

  for (const u of urlsToPin) {
    logger.debug(`Creating tab for ${u}`);
    await browser.tabs.create({
      // Don't force focus on it.
      active: false,
      // Ensure it's pinned
      pinned: true,
      // Provide URL of the tab
      url: u,
      // The window to open the tabs in
      windowId: windowID,
    });
  }
}

/**
 * @param {number} windowID
 */
export async function closePinnedTabs(windowID: number) {
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
    logger.debug(`Removing tab ${i}`);
    tabsToClose.push(t.id);
  }
  await browser.tabs.remove(tabsToClose);
}
