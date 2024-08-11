<script lang="ts">
  export let visible: boolean;
</script>

<div class="c-loader" class:c-loader--hidden={!visible}>Loading</div>

<style>
  .c-loader,
  .c-loader:after {
    border-radius: 50%;
    width: var(--p-8);
    height: var(--p-8);
    aspect-ratio: 1;
    overflow: hidden;
  }

  .c-loader {
    font-size: var(--p-4);
    position: relative;
    text-indent: -9999em;
    border-width: var(--p-2);
    border-style: solid;
    border-color: var(--primary-grey);
    border-left-color: var(--primary-light);
    animation: loaderKeyFrames 1.1s infinite linear;
  }

  .c-loader--hidden {
    visibility: hidden;
    animation: none;
  }

  @keyframes loaderKeyFrames {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
</style>
