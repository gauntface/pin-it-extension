import { mount } from "svelte";
import Options from "./Options.svelte";
import "./options.css";

const app = mount(Options, {
  target: document.getElementById("app") as HTMLElement,
});

export default app;
