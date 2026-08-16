import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import CompanionPanel from "./CompanionPanel";
import cssText from "./styles.css?inline";

let root: Root | null = null;
let host: HTMLDivElement | null = null;

export function openCompanion(problemId: string, problemTitle: string) {
  if (host) {
    return;
  }

  host = document.createElement("div");

  host.id = "cses-companion-host";

  Object.assign(host.style, {
    position: "fixed",
    inset: "0",
    zIndex: "999999",
    pointerEvents: "none",
  });

  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({
    mode: "open",
  });

  const style = document.createElement("style");
  style.textContent = cssText;
  shadowRoot.appendChild(style);

  const container = document.createElement("div");
  container.id = "cses-companion-root";
  container.style.pointerEvents = "auto";

  shadowRoot.appendChild(container);

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

  if (host) {
    host.remove();
    host = null;
  }
}
