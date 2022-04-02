import {logger} from './utils/_logger';
import {getUrlsToPin, setUrlsToPin} from './models/_pinned-tabs';

const PINNED_TABS_PAGE_SELECTOR = '.js-pinned-tabs-page';
const PINNED_TABS_LIST_SELECTOR = '.js-pinned-tabs-list';
const ERROR_PAGE_SELECTOR = '.js-error-page';
const LOADING_PAGE_SELECTOR = '.js-loading-page';
const EDIT_URLS_BTN_SELECTOR = '.js-edit-urls-btn';
const EDIT_URLS_LIST_SELECTOR = '.js-edit-urls-list';
const EDIT_URLS_PAGE_SELECTOR = '.js-edit-urls-page';
const SAVE_URLS_BTN_SELECTOR = '.js-save-urls-btn';

const PAGE_HIDDEN_CLASS = 'l-page--is-hidden';
const DEFAULT_TEXT = 'https://......';

/**
 * Hide all "pages" in the given HTML page
 */
function hideAllPages() {
  const pages = document.querySelectorAll('.l-page');
  for (const page of pages) {
    page.classList.add(PAGE_HIDDEN_CLASS);
  }
}

/**
 * Switch to the current page, hiding all other pages
 * @param {string} selector The query selector for the page to show
 */
function switchPage(selector: string) {
  hideAllPages();
  const page = document.querySelector(selector);
  page.classList.remove(PAGE_HIDDEN_CLASS);
}

/**
 * Show an error message to the user
 * @param {string} msg The message to display to the user
 */
function showError(msg: string) {
  const errorMsg = document.querySelector('.js-error-msg');
  errorMsg.textContent = msg;
  switchPage(ERROR_PAGE_SELECTOR);
}

/**
 * A helper function that will show the loading page
 */
function showLoadingPage() {
  switchPage(LOADING_PAGE_SELECTOR);
}

/**
 * Show the page that lists the URLs to create pinned tabs for.
 */
async function showPinnedTabsPage() {
  const urls = await getUrlsToPin();
  const pinnedTabsList = document.querySelector(PINNED_TABS_LIST_SELECTOR);
  while (pinnedTabsList.firstChild) {
    pinnedTabsList.removeChild(pinnedTabsList.firstChild);
  }

  for (const url of urls) {
    const listItem = document.createElement('li');
    listItem.textContent = url;
    pinnedTabsList.appendChild(listItem);
  }

  switchPage(PINNED_TABS_PAGE_SELECTOR);
}

/**
 * Show the page where the user can edit the list of URLs.
 */
async function showEditURLsPage() {
  let urls = await getUrlsToPin();
  const urlsList = document.querySelector(EDIT_URLS_LIST_SELECTOR);
  while (urlsList.firstChild) {
    urlsList.removeChild(urlsList.firstChild);
  }

  // In edit mode we need at least 1 li element to allow editing.
  if (urls.length === 0) {
    urls = [DEFAULT_TEXT];
  }

  for (const url of urls) {
    const listItem = document.createElement('li');
    listItem.textContent = url;
    urlsList.appendChild(listItem);
  }

  switchPage(EDIT_URLS_PAGE_SELECTOR);
}

/**
 * Save the list of URLs to the extension sync.
 */
async function saveURLs() {
  const urlsList = document.querySelector(EDIT_URLS_LIST_SELECTOR);

  const newUrls = [];
  const listItems = urlsList.querySelectorAll('li');
  for (const item of listItems) {
    const urlText = item.textContent;
    try {
      if (urlText.length === 0 || urlText === DEFAULT_TEXT) {
        continue;
      }

      const parsedUrl = new URL(urlText);
      newUrls.push(parsedUrl.toString());
    } catch (err) {
      logger.warn('Found an invalid URL: ', urlText);
    }
  }

  await setUrlsToPin(newUrls);
}

/**
 * Once the page is loaded, this will add event listeners to buttons in the
 * page.
 */
function setupButtons() {
  const editBtn = document.querySelector(EDIT_URLS_BTN_SELECTOR);
  editBtn.addEventListener('click', async () => {
    showLoadingPage();
    await showEditURLsPage();
  });

  const saveBtn = document.querySelector(SAVE_URLS_BTN_SELECTOR);
  saveBtn.addEventListener('click', async () => {
    showLoadingPage();
    await saveURLs();
    await showPinnedTabsPage();
  });
}

window.addEventListener('load', async () => {
  logger.log('Loading options page...');
  try {
    setupButtons();
    await showPinnedTabsPage();
  } catch (err) {
    logger.error(`Failed to load pinned tabs page: `, err);
    showError(err);
  }
});
