<script lang="ts">
  import { getContext } from "svelte";
  import LayoutOptionsSection from "./LayoutOptionsSection.svelte";
  import { AutoOpenTabsStore } from "../../../../libs/models/_auto-open-tabs-store";
  import Checkbox from "../../../components/checkbox/Checkbox.svelte";

  const autoOpenTabs = getContext<AutoOpenTabsStore>("open-tabs");

  $: autoOpenTabsNewWindow = $autoOpenTabs.autoOpenTabsNewWindow;

  function updateOpenTabsNewWindow(e: Event) {
    if (e && e.currentTarget) {
      const input = e.currentTarget as HTMLInputElement;
      autoOpenTabs.setAutoOpenTabsNewWindow(input.checked);
    }
  }
</script>

<LayoutOptionsSection title="Automatically Open Tabs" isExperimental={true}>
  <Checkbox
    label={"Automatically open tabs when a new window is opened"}
    checked={autoOpenTabsNewWindow}
    on:input={updateOpenTabsNewWindow}
  />
</LayoutOptionsSection>

<style>
</style>
