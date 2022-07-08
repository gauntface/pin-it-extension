import * as Sentry from '@sentry/browser';
import {BrowserTracing} from '@sentry/tracing';
import * as browser from 'webextension-polyfill';

Sentry.init({
  dsn: 'https://0b9cdcee8d8040edb9cc9586ecb52a14@o1296550.ingest.sentry.io/6556279',
  integrations: [new BrowserTracing()],
  release: `pin-it-extension@${browser.runtime.getManifest().version}`,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});
