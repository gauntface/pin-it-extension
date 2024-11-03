import { vi } from "vitest";

export const storage = {
  sync: {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
  },
};

const browser = {
  storage,
};
export default browser;
