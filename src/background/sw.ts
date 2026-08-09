import * as browser from "webextension-polyfill";
import {
  closePinnedTabs,
  openPinnedTabs,
} from "../libs/controllers/_open-tabs";
import { getAutoOpenTabs } from "../libs/models/_auto-open-tabs-browser-storage";
import { getUrlsToPin } from "../libs/models/_pinned-tabs-browser-storage";
import "../libs/monitoring/_sentry";
import { logger } from "../libs/utils/_logger";

// Windows currently being closed+reopened, keyed by window ID. Guards
// against action.onClicked and windows.onCreated racing on the same
// window - without this, two concurrent close+open passes on one tab
// strip is itself a common cause of "Tabs cannot be edited right now".
const windowsBeingManaged = new Set<number>();

browser.action.onClicked.addListener(async (_tab) => {
  logger.log("Extension icon was clicked, loading pinned tabs...");
  const pins = await getUrlsToPin();
  if (pins.length === 0) {
    logger.log("No pins configured, so openning the options page.");
    await browser.runtime.openOptionsPage();
    return;
  }

  const window = await browser.windows.getCurrent();
  closeAndOpenTabs(window);
});

browser.windows.onCreated.addListener(
  async (window: browser.Windows.Window) => {
    const autoOpen = await getAutoOpenTabs();
    if (!autoOpen.autoOpenTabsNewWindow) {
      return;
    }

    closeAndOpenTabs(window);
  },
);

async function closeAndOpenTabs(window: browser.Windows.Window) {
  if (!window) {
    logger.log("No window provided.");
    return;
  }

  if (window.type !== "normal") {
    logger.log(`Window has an unexpected type: ${window.type}`);
    return;
  }

  if (!window.id) {
    logger.log("Window has no ID.");
    return;
  }

  const windowID = window.id;
  if (windowsBeingManaged.has(windowID)) {
    logger.log(
      `Window ${windowID} is already being managed, skipping duplicate request.`,
    );
    return;
  }

  windowsBeingManaged.add(windowID);
  try {
    await closePinnedTabs(windowID);
    await openPinnedTabs(windowID);
  } catch (err) {
    logger.error(`Giving up opening tabs in window ${windowID}.`, err);
  } finally {
    windowsBeingManaged.delete(windowID);
  }
}
