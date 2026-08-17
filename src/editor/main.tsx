import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./monacoEnvironment";
import EditorApp from "./EditorApp";
import "./editor.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EditorApp />
  </StrictMode>,
);
