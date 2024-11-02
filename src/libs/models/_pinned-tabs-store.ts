import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
} from "svelte/store";
import { getUrlsToPin, setUrlsToPin } from "./_pinned-tabs-browser-storage";
import debounce, { type DebouncedFunc } from "lodash-es/debounce";

export class PinnedTabsStore implements Readable<PinnedTabs> {
  private _subscribers = new Set<Subscriber<PinnedTabs>>();
  private _urls: string[] = [];
  private _debounceCallCount = 0;
  private _pendingChanges: boolean = false;
  private _debouncedSetURLs: DebouncedFunc<() => void>;

  constructor() {
    this._debouncedSetURLs = debounce(async () => {
      const thisCallCount = this._debounceCallCount;
      await setUrlsToPin(this._urls);
      this._pendingChanges = this._debounceCallCount !== thisCallCount;
      this.notifySubscribers();
    }, 1000);
    this.initialize();
  }

  // Get the current state of this store
  private get state(): PinnedTabs {
    let urls = [...this._urls];
    if (urls.length === 0) {
      urls = [""];
    }
    return {
      urls,
      pendingChanges: this._pendingChanges,
    };
  }

  // Initialize the values of this store
  private async initialize() {
    this._urls = await getUrlsToPin();
    this.notifySubscribers();
  }

  // Subscribe to this store (Part of Readable interface)
  subscribe(sub: Subscriber<PinnedTabs>): Unsubscriber {
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

  saveURLs(urls: string[]) {
    if (JSON.stringify(this._urls) === JSON.stringify(urls)) {
      return;
    }

    this._urls = urls;
    this._pendingChanges = true;
    this.notifySubscribers();
    this._debounceCallCount++;
    this._debouncedSetURLs();
  }
}

interface PinnedTabs {
  urls: string[];
  pendingChanges: boolean;
}
