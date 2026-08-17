import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import type { ScrapedProblem } from "../../types/problem";
import CompanionPanel from "./CompanionPanel";
import cssText from "./styles.css?inline";

let root: Root | null = null;
let host: HTMLDivElement | null = null;

export function openCompanion(
  problemId: string,
  problemTitle: string,
  scraped: ScrapedProblem | null,
) {
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

  // KaTeX renders the problem's math client-side before we scrape it; the
  // rendered spans keep their katex classes, so pull the stylesheet in here
  // too since shadow DOM styles are isolated from the host page.
  const katexStyle = document.createElement("link");
  katexStyle.rel = "stylesheet";
  katexStyle.href = "https://cses.fi/lib/katex/katex.min.css";
  shadowRoot.appendChild(katexStyle);

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
      scraped={scraped}
      portalContainer={container}
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
