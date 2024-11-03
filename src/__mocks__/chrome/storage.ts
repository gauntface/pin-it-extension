/* eslint-disable @typescript-eslint/no-explicit-any, no-console */
const STORAGE_DELAY_S = 4;

globalThis.chrome = globalThis.chrome || {};
globalThis.chrome.storage = globalThis.chrome.storage || {};

const storage: { [key: string]: any } = {};
globalThis.chrome.storage.sync = {
  get: async (key: string) => {
    return { [key]: storage[key] };
  },
  set: async (map) => {
    for (const [key, value] of Object.entries(map)) {
      storage[key] = value;
    }
    if (import.meta.env.VITE_ENV === "development") {
      console.log(
        `Chrome Extension Mock: Storage ${STORAGE_DELAY_S}s delay start`,
        storage,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, STORAGE_DELAY_S * 1000),
      );
      console.log(
        `Chrome Extension Mock: Storage ${STORAGE_DELAY_S}s delay end`,
      );
    }
  },
};

globalThis.chrome.storage.local = globalThis.chrome.storage.sync;
