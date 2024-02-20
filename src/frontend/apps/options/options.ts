import Options from "./Options.svelte";

const app = new Options({
  target: document.getElementById("app") as HTMLElement,
});

export default app;
