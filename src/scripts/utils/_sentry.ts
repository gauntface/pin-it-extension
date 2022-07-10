import * as Sentry from '@sentry/browser';
import * as browser from 'webextension-polyfill';

Sentry.init({
  dsn: 'https://0b9cdcee8d8040edb9cc9586ecb52a14@o1296550.ingest.sentry.io/6556279',
  integrations: [],
  release: `pin-it-extension@${browser.runtime.getManifest().version}`,
  tracesSampleRate: 0.1,
});
