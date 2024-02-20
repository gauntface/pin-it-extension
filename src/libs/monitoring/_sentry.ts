import * as Sentry from '@sentry/browser';
import * as browser from 'webextension-polyfill';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [],
  release: `pin-it-extension@${browser.runtime.getManifest().version}`,
  tracesSampleRate: 0.1,
});
