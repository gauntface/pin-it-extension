<script lang="ts">
  import Divider from "../../components/divider/Divider.svelte";
  import Loader from "../../components/loader/Loader.svelte";
  import URLItem from "../../components/url-item/URLItem.svelte";
  import BuyMeACoffee from "../../components/bmc/BuyMeACoffee.svelte";
  import {
    getUrlsToPin,
    setUrlsToPin,
  } from "../../../libs/models/_pinned-tabs";
  import { DebounceWork } from "../../../libs/models/_debounce-work";

  let pendingChanges = false;
  let urls: Array<string> = [];
  const debouncedSaveURLs = new DebounceWork(async () => {
    await setUrlsToPin(urls);
    pendingChanges = !debouncedSaveURLs.isComplete();
  });

  getUrlsToPin().then((result) => {
    urls = result;
  });

  function saveURLs() {
    pendingChanges = true;
    debouncedSaveURLs.run();
  }

  function addURL() {
    urls = [...urls, ""];
  }

  function onURLChange(index: number, value: string) {
    if (urls[index] === value) {
      return;
    }

    urls[index] = value;
    saveURLs();
  }

  function onDeleteURL(index: number) {
    urls.splice(index, 1);
    urls = [...urls];
    saveURLs();
  }
</script>

<main class="l-settings">
  <header class="l-settings-header">
    <h1>Options</h1>
    {#if pendingChanges}
      <Loader />
    {/if}
  </header>

  <Divider />

  <div>
    <p>
      Edit the list of URLs below to setup which tabs you'd like to be pinned in
      your browser. Please make sure they are valid URLs, starting with
      <code>http://</code> or <code>https://</code>.
    </p>
    <p>Once set-up, just click the extension icon and the tabs will open.</p>
  </div>

  <section class="l-settings-section">
    <div class="l-settings-section__title">Pinned Tabs</div>
    <div class="l-settings-section__body-list">
      {#each urls as url, i (i)}
        <URLItem id={i} {url} {onURLChange} {onDeleteURL} />
      {/each}
      <button title="Add URL" on:click={addURL}>Add URL</button>
    </div>
  </section>

  <section class="l-settings-bmc">
    <BuyMeACoffee />
  </section>
</main>
