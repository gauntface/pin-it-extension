import { debounce } from 'lodash'

export class DebounceWork {
  private debouncedFn: () => void
  private pendingCalls: number = 0
  private chain: Promise<void> = Promise.resolve()

  constructor (public fn: () => Promise<void>) {
    this.debouncedFn = debounce(() => {
      // Reset pending calls
      this.pendingCalls = 0
      // Append to queue of work
      this.chain = this.chain.then(() => fn())
    }, 1000)
  }

  run () {
    this.pendingCalls++
    this.debouncedFn()
  }

  isComplete () {
    return this.pendingCalls === 0
  }
}
