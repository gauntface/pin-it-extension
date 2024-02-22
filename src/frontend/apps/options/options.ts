import Options from "./Options.svelte";
import "./options.css";

const app = new Options({
  target: document.getElementById("app") as HTMLElement,
});

export default app;
