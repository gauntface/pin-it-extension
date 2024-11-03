<script lang="ts">
  import { PinnedTabsStore } from "../../../../libs/models/_pinned-tabs-store";
  import { getContext } from "svelte";
  import URLItem from "../../../components/url-item/URLItem.svelte";
  import LayoutOptionsSection from "./LayoutOptionsSection.svelte";
  import DragGrip from "./DragGrip.svelte";

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

  let draggedItem: number | null = null;
  let originalDraggedItemIndex: number | null = null;

  function gripMouseDown(event: MouseEvent) {
    const grip = event.target as HTMLElement;
    const parent = grip.closest(".c-pinned-urls-list__draggable-grip");
    parent?.setAttribute("draggable", "true");
  }

  function gripMouseUp(event: MouseEvent) {
    const grip = event.target as HTMLElement;
    const parent = grip?.parentNode as HTMLElement;
    parent?.setAttribute("draggable", "false");
  }

  function onDragStart(event: DragEvent, index: number) {
    // Cancel any in progress save so the order doesn't change in the UI
    // mid-drag.
    pinnedURLs.cancelSave();

    draggedItem = index;
    originalDraggedItemIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect =
        originalDraggedItemIndex === index ? "none" : "move";
    }
    if (draggedItem === null || draggedItem === index) {
      return;
    }
    const newUrls = [...urls];
    const [removed] = newUrls.splice(draggedItem, 1);
    newUrls.splice(index, 0, removed);
    urls = newUrls;
    draggedItem = index;
  }

  function onDragEnd(event: DragEvent) {
    event.preventDefault();
    // Save the new set of URLs (it'll handle the scenario of no change)
    pinnedURLs.saveURLs(urls);
    draggedItem = null;
    originalDraggedItemIndex = null;
  }
</script>

<LayoutOptionsSection title="Pinned Tabs">
  <div class="c-pinned-urls-list">
    {#each urls as url, i (i)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="c-pinned-urls-list__draggable-container"
        class:c-pinned-urls-list--being-dragged={draggedItem === i}
        on:dragover={(e) => onDragOver(e, i)}
        on:dragend={(e) => onDragEnd(e)}
      >
        <div
          class="c-pinned-urls-list__draggable-grip"
          on:mousedown={(e) => gripMouseDown(e)}
          on:mouseup={(e) => gripMouseUp(e)}
          on:dragstart={(e) => onDragStart(e, i)}
        >
          <DragGrip />
        </div>
        <div class="c-pinned-urls-list__draggable-body">
          <URLItem id={i} {url} {onURLChange} {onDeleteURL} />
        </div>
      </div>
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

  .c-pinned-urls-list__draggable-container {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    cursor: default;
    transition: opacity 0.1s linear;
  }

  .c-pinned-urls-list__draggable-grip {
    cursor: grab;
  }

  .c-pinned-urls-list__draggable-grip:active {
    cursor: grabbing;
  }

  .c-pinned-urls-list--being-dragged {
    opacity: 0.5;
  }

  .c-pinned-urls-list--being-dragged .c-pinned-urls-list__draggable-grip {
    cursor: grabbing;
  }
</style>
