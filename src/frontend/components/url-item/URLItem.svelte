<script lang="ts">
  export let id: number
  export let url: string
  export let handleURLChange: (id: number, value: string) => void

  let inputElement: HTMLInputElement

  function _handleURLChange () {
    handleURLChange(id, inputElement.value)
  }
</script>

<div>
  <input type="url" placeholder="Enter a URL" value={url} bind:this={inputElement} on:input={_handleURLChange} />
</div>

<style src="./c-url-item.css"></style>
