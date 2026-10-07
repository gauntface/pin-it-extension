import { vi } from "vitest";

export const storage = {
  sync: {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
  },
};

export const tabs = {
  create: vi.fn().mockResolvedValue({}),
  remove: vi.fn().mockResolvedValue(undefined),
};

const browser = {
  storage,
  tabs,
};
export default browser;
