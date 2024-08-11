<script lang="ts">
  import { PinnedTabsStore } from "../../../../libs/models/_pinned-tabs-store";

  import { getContext } from "svelte";
  import URLItem from "../../../components/url-item/URLItem.svelte";
  import LayoutOptionsSection from "./LayoutOptionsSection.svelte";

  const pinnedURLs = getContext<PinnedTabsStore>("pinned-urls");

  $: urls = $pinnedURLs.urls;

  function addURL() {
    pinnedURLs.saveURLs([...urls, ""]);
  }

  function onURLChange(index: number, value: string) {
    if (urls[index] === value) {
      return;
    }

    urls[index] = value;
    pinnedURLs.saveURLs(urls);
  }

  function onDeleteURL(index: number) {
    urls.splice(index, 1);
    pinnedURLs.saveURLs([...urls]);
  }
</script>

<LayoutOptionsSection title="Pinned Tabs">
  <div class="c-pinned-urls-list">
    {#each urls as url, i (i)}
      <URLItem id={i} {url} {onURLChange} {onDeleteURL} />
    {/each}
    <button title="Add URL" on:click={addURL}>Add URL</button>
  </div>
</LayoutOptionsSection>

<style>
  .c-pinned-urls-list {
    width: 100%;
    display: inline-flex;
    flex-direction: column;
    gap: var(--p-4);
  }

  .c-pinned-urls-list button {
    align-self: center;
  }
</style>
