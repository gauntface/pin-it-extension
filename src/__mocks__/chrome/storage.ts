globalThis.chrome = globalThis.chrome || {}
globalThis.chrome.storage = globalThis.chrome.storage || {}

const storage = {}
globalThis.chrome.storage.sync = {
  get: async (key) => {
    return { [key]: storage[key] }
  },
  set: async (map) => {
    for (const [key, value] of Object.entries(map)) {
      storage[key] = value
    }
    console.log('Chrome Extension Mock: Storage 4s delay start')
    await new Promise((resolve) => setTimeout(resolve, 4000))
    console.log('Chrome Extension Mock: Storage 4s delay end')
  }
}

globalThis.chrome.storage.local = globalThis.chrome.storage.sync
