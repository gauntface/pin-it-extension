<script lang="ts">
  import { PinnedTabsStore } from "../../../libs/models/_pinned-tabs-store";
  import Divider from "../../components/divider/Divider.svelte";
  import Loader from "../../components/loader/Loader.svelte";
  import PinnedTabs from "./components/PinnedTabs.svelte";
  import AutoOpenTabs from "./components/AutoOpenTabs.svelte";
  import BuyMeACoffee from "../../components/bmc/BuyMeACoffee.svelte";
  import { setContext } from "svelte";
  import { AutoOpenTabsStore } from "../../../libs/models/_auto-open-tabs-store";

  const pinnedURLs = new PinnedTabsStore();
  setContext("pinned-urls", pinnedURLs);

  const autoOpenTabs = new AutoOpenTabsStore();
  setContext("open-tabs", autoOpenTabs);

  $: pendingChanges =
    $pinnedURLs.pendingChanges || $autoOpenTabs.pendingChanges;
</script>

<main class="l-settings">
  <header class="l-settings-header">
    <h1>Options</h1>
    <Loader visible={pendingChanges} />
  </header>

  <Divider />

  <div class="c-options-help">
    <h2>Using Pin-It</h2>
    <p>
      Edit the list of URLs below to setup which tabs you'd like to be pinned in
      your browser. Please make sure they are valid URLs, starting with
      <code>http://</code> or <code>https://</code>.
    </p>

    <p>
      Once set-up, just click the extension icon and the tabs will open, <a
        href="https://www.gaunt.dev/projects/pin-it/">Learn more here</a
      >.
    </p>
  </div>

  <Divider />

  <div class="l-options-sections">
    <PinnedTabs />
    <AutoOpenTabs />
  </div>

  <section class="l-settings-bmc">
    <BuyMeACoffee />
  </section>
</main>

<style>
  .l-settings {
    display: grid;
    grid-template-rows: auto auto auto auto 1fr auto;
    width: 100%;
    max-width: 680px;
    flex: 1;
    padding: var(--p-8);
    container-type: inline-size;
  }

  .l-settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .l-settings h2 {
    margin-bottom: var(--p-4);
  }

  .c-options-help p:last-child {
    padding-bottom: 0;
  }

  .l-options-sections {
    display: flex;
    flex-direction: column;
    gap: var(--p-8);
  }
</style>
