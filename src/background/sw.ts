import * as browser from "webextension-polyfill";
import {
  closePinnedTabs,
  openPinnedTabs,
} from "../libs/controllers/_open-tabs";
import { getAutoOpenTabs } from "../libs/models/_auto-open-tabs-browser-storage";
import { getUrlsToPin } from "../libs/models/_pinned-tabs-browser-storage";
import "../libs/monitoring/_sentry";
import { logger } from "../libs/utils/_logger";
import { sleep } from "../libs/utils/_sleep";

const RETRY_SLEEP_MS = 100;
// After 5 minutes, give up.
const MAX_RETRIES = 5 * 60 * 1000;

browser.action.onClicked.addListener(async (_tab) => {
  logger.log("Extension icon was clicked, loading pinned tabs...");
  const pins = await getUrlsToPin();
  if (pins.length === 0) {
    logger.log("No pins configured, so openning the options page.");
    await browser.runtime.openOptionsPage();
    return;
  }

  const window = await browser.windows.getCurrent();
  if (window.id) {
    await closePinnedTabs(window.id);
    await openPinnedTabs(window.id);
  }
});

browser.windows.onCreated.addListener(async (window) => {
  const autoOpen = await getAutoOpenTabs();
  if (!autoOpen.autoOpenTabsNewWindow) {
    return;
  }

  if (window.type === "normal" && window.id) {
    const windowID = window.id;
    for (let i = 0; i <= MAX_RETRIES; i += RETRY_SLEEP_MS) {
      try {
        await closePinnedTabs(windowID);
        await openPinnedTabs(windowID);
        break;
      } catch (err) {
        // Sometimes the browser will throw if we try to open tabs too
        // quickly.
        logger.debug("Failed to open tabs, retrying...", err);
      }
      await sleep(RETRY_SLEEP_MS);
      const windowToManage = await browser.windows.get(windowID);
      if (windowToManage === undefined) {
        break;
      }
    }
  }
});
