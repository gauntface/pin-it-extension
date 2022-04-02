import * as browser from "webextension-polyfill";
import { logger } from "../utils/_logger";
import { openPinnedTabs, closePinnedTabs } from "../controllers/_open-tabs";
import { getUrlsToPin } from "../models/_pinned-tabs";

browser.action.onClicked.addListener(async (tab) => {
  logger.log("Extension icon was clicked, loading pinned tabs...");
  try {
    const pins = await getUrlsToPin();
    if (pins.length === 0) {
      logger.log(`No pins configured, so openning the options page.`);
      await browser.runtime.openOptionsPage();
      return;
    }

    const window = await browser.windows.getCurrent();
    await closePinnedTabs(window.id);
    await openPinnedTabs(window.id);
  } catch (err) {
    logger.error(`Failed to load pinned tabs: `, err);
  }
});
