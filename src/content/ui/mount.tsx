import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import CompanionPanel from "./CompanionPanel";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

export function openCompanion(problemId: string, problemTitle: string) {
  if (container) {
    return;
  }

  container = document.createElement("div");

  container.id = "cses-companion-root";

  document.body.appendChild(container);

  root = createRoot(container);

  root.render(
    <CompanionPanel
      problemId={problemId}
      problemTitle={problemTitle}
      onClose={closeCompanion}
    />,
  );
}

export function closeCompanion() {
  if (root) {
    root.unmount();
    root = null;
  }

  if (container) {
    container.remove();
    container = null;
  }
}
