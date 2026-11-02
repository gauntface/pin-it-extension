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

// ID of the Firefox-only "Options" item on the toolbar icon's menu.
const OPTIONS_MENU_ID = "pin-it-options";

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

// Firefox only: add an "Options" item to the toolbar icon's right-click
// menu. The "menus" permission is only added to the Firefox manifest, and
// Chrome has no menus namespace, so browser.menus is undefined there (even
// though the types say it is always defined).
if (browser.menus) {
  createOptionsMenu();

  browser.menus.onClicked.addListener(async (info) => {
    if (info.menuItemId === OPTIONS_MENU_ID) {
      logger.log("Options menu item was clicked, opening the options page.");
      await browser.runtime.openOptionsPage();
    }
  });
}

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
    const newTabIDs = await openPinnedTabs(windowID);
    await closePinnedTabs(windowID, newTabIDs);
  } catch (err) {
    logger.error(`Giving up opening tabs in window ${windowID}.`, err);
  } finally {
    windowsBeingManaged.delete(windowID);
  }
}

// Created on every background start rather than in runtime.onInstalled,
// because Firefox wasn't delivering onInstalled to this background script,
// even on a fresh install. Firefox keeps menu items across event page
// restarts, so after the first start this reports a duplicate ID error via
// runtime.lastError, which is expected and only logged at debug level.
function createOptionsMenu() {
  browser.menus.create(
    {
      id: OPTIONS_MENU_ID,
      title: "Options",
      contexts: ["action"],
    },
    () => {
      const err = browser.runtime.lastError;
      if (err) {
        logger.debug("Options menu item not created.", err);
      }
    },
  );
}
