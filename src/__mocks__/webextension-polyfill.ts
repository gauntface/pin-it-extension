import { vi } from "vitest";

export const storage = {
  sync: {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
  },
};

export const tabs = {
  create: vi.fn(),
  query: vi.fn(),
  remove: vi.fn(),
};

const browser = {
  storage,
  tabs,
};
export default browser;
