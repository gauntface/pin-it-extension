<script lang="ts">
  export let id: number;
  export let url: string;
  export let onURLChange: (id: number, value: string) => void;
  export let onDeleteURL: (id: number) => void;

  let inputElement: HTMLInputElement;

  function _handleURLChange() {
    onURLChange(id, inputElement.value);
  }
</script>

<div class="c-url-item">
  <input
    type="url"
    placeholder="Enter a URL"
    value={url}
    bind:this={inputElement}
    on:input={_handleURLChange}
  />
  <button on:click={() => onDeleteURL(id)}>Delete</button>
</div>

<style src="./c-url-item.css"></style>
