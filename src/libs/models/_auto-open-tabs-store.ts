import debounce, { type DebouncedFunc } from "lodash-es/debounce";
import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
} from "svelte/store";
import {
  getAutoOpenTabs,
  setAutoOpenTabs,
} from "./_auto-open-tabs-browser-storage";

export const PINNED_TAB_STORE_ID = "pinned-tabs";

export class AutoOpenTabsStore implements Readable<AutoOpenTabs> {
  private _subscribers = new Set<Subscriber<AutoOpenTabs>>();
  private _autoOpenTabsNewWindow: boolean = false;
  private _debounceCallCount = 0;
  private _pendingChanges: boolean = false;
  private _debouncedAutoOpen: DebouncedFunc<() => void>;

  constructor() {
    this._debouncedAutoOpen = debounce(async () => {
      const thisCallCount = this._debounceCallCount;
      await setAutoOpenTabs({
        autoOpenTabsNewWindow: this._autoOpenTabsNewWindow,
      });
      this._pendingChanges = this._debounceCallCount !== thisCallCount;
      this.notifySubscribers();
    }, 1000);
    this.initialize();
  }

  // Get the current state of this store
  private get state(): AutoOpenTabs {
    return {
      autoOpenTabsNewWindow: this._autoOpenTabsNewWindow,
      pendingChanges: this._pendingChanges,
    };
  }

  // Initialize the values of this store
  private async initialize() {
    const opts = await getAutoOpenTabs();
    this._autoOpenTabsNewWindow = opts.autoOpenTabsNewWindow;
    this.notifySubscribers();
  }

  // Subscribe to this store (Part of Readable interface)
  subscribe(sub: Subscriber<AutoOpenTabs>): Unsubscriber {
    this._subscribers.add(sub);
    sub(this.state);
    return () => {
      this._subscribers.delete(sub);
    };
  }

  // Notify subscribers of a change in state
  private notifySubscribers = () => {
    this._subscribers.forEach((sub) => sub(this.state));
  };

  setAutoOpenTabsNewWindow(open: boolean) {
    this._autoOpenTabsNewWindow = open;
    this._pendingChanges = true;
    this.notifySubscribers();
    this._debounceCallCount++;
    this._debouncedAutoOpen();
  }
}

interface AutoOpenTabs {
  autoOpenTabsNewWindow: boolean;
  pendingChanges: boolean;
}
