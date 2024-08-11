<script lang="ts">
  export let title: string;
  export let isExperimental: boolean = false;
</script>

<section class="l-options-section">
  <div class="l-options-section__title">
    {title}{#if isExperimental}
      &nbsp;<span class="l-options-section__title--experimental"
        >Experimental</span
      >
    {/if}
  </div>
  <div class="l-options-section__body"><slot /></div>
</section>

<style>
  .l-options-section__title {
    font-weight: 600;
    margin-bottom: var(--p-2);
  }

  .l-options-section__body {
    width: 100%;
  }

  .l-options-section__title--experimental {
    background-color: var(--highlight);
    padding: 0.2rem 0.3rem;
    border-radius: 1rem;
    font-size: 0.7rem;
    line-height: 0.8rem;
    color: white;
  }
</style>
