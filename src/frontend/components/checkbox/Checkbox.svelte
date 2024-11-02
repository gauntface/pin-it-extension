<script lang="ts">
  export let label: string;
  export let checked: boolean;
</script>

<div class="l-switch">
  <div class="c-switch">
    <input
      id="input-switch"
      type="checkbox"
      class="c-switch__input"
      bind:checked
      on:input
    />
    <label for="input-switch" class="c-switch__track"></label>
  </div>

  <label for="input-switch" class="c-switch__label">{label}</label>
</div>

<style>
  .l-switch {
    --switch-width: 3rem;
    --switch-height: 1.5rem;

    display: flex;
    flex-direction: row;
    gap: var(--p-4);
    line-height: var(--switch-height);
    align-items: flex-start;
  }
  .c-switch {
    position: relative;
    display: inline-block;
  }

  /* Hide the input */
  .c-switch__input {
    display: none;
  }

  /* Size and hide label */
  .c-switch__track {
    display: block;
    width: var(--switch-width);
    height: var(--switch-height);
    text-indent: -150%;
    clip: rect(0 0 0 0);
    color: transparent;
    user-select: none;
  }

  .c-switch__track::before,
  .c-switch__track::after {
    content: "";
    display: block;
    position: absolute;
    cursor: pointer;
  }

  /* The switch track */
  .c-switch__track::before {
    width: 100%;
    height: 100%;
    background-color: #dedede;
    border-radius: 9999em;
    transition: background-color 0.25s ease;
  }
  .c-switch__input:checked + .c-switch__track::before {
    background-color: var(--highlight);
  }

  /* The switch handle */
  .c-switch__track::after {
    top: 0.15rem;
    left: 0.15rem;
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    background-color: #fff;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.45);
    transition: left 0.25s ease;
  }
  .c-switch__input:checked + .c-switch__track::after {
    left: calc(3rem - 1.35rem);
  }
</style>
