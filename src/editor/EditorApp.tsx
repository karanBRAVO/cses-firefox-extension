import { useEffect, useRef, useState } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
// Import Monaco's lean editor core plus only the three languages this
// editor actually supports, instead of the full `monaco-editor` package
// (which also registers TypeScript/JSON/CSS/HTML language *services*, not
// just syntax highlighting — those pull in multi-megabyte worker bundles,
// like a >5MB ts.worker chunk that Firefox's AMO validator refuses to even
// parse, none of which this editor ever uses).
import * as monaco from "monaco-editor/editor/editor.api";
import "monaco-editor/languages/definitions/cpp/register";
import "monaco-editor/languages/definitions/python/register";
import "monaco-editor/languages/definitions/java/register";
import {
  DEFAULT_EDITOR_SETTINGS,
  type EditorLanguage,
  type EditorSettings,
  type EditorToParentMessage,
  type ParentToEditorMessage,
} from "./protocol";
import {
  loadEditorSettings,
  loadStoredCode,
  saveEditorSettings,
  saveStoredCode,
  type StoredProblemCode,
} from "./storage";

loader.config({ monaco });

const DEFAULT_SNIPPETS: Record<EditorLanguage, string> = {
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n`,
  python: `def main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n`,
};

const SAVE_DEBOUNCE_MS = 400;

function postToParent(message: EditorToParentMessage) {
  window.parent.postMessage(message, "*");
}

function getProblemId(): string | null {
  return new URLSearchParams(window.location.search).get("problemId");
}

function getAccountId(): string {
  return (
    new URLSearchParams(window.location.search).get("accountId") ?? "anonymous"
  );
}

async function persist(
  accountId: string,
  problemId: string,
  data: StoredProblemCode,
) {
  postToParent({ type: "cses-companion/save-status", status: "saving" });
  await saveStoredCode(accountId, problemId, data);
  postToParent({ type: "cses-companion/save-status", status: "saved" });
}

export default function EditorApp() {
  const problemIdRef = useRef(getProblemId());
  const problemId = problemIdRef.current;
  const accountIdRef = useRef(getAccountId());
  const accountId = accountIdRef.current;

  const [language, setLanguage] = useState<EditorLanguage>("cpp");
  const [code, setCode] = useState(DEFAULT_SNIPPETS.cpp);
  const [isDark, setIsDark] = useState(true);
  const [settings, setSettings] = useState<EditorSettings>(
    DEFAULT_EDITOR_SETTINGS,
  );
  const codeByLanguage = useRef<Record<EditorLanguage, string>>({
    ...DEFAULT_SNIPPETS,
  });
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!problemId) {
      return;
    }

    void loadStoredCode(accountId, problemId).then((stored) => {
      if (!stored) {
        return;
      }

      codeByLanguage.current = { ...DEFAULT_SNIPPETS, ...stored.code };
      setLanguage(stored.language);
      setCode(codeByLanguage.current[stored.language]);
    });
  }, [accountId, problemId]);

  useEffect(() => {
    void loadEditorSettings().then((stored) => {
      if (stored) {
        setSettings({ ...DEFAULT_EDITOR_SETTINGS, ...stored });
      }
    });
  }, []);

  useEffect(() => {
    postToParent({ type: "cses-companion/editor-settings", settings });
  }, [settings]);

  useEffect(() => {
    postToParent({ type: "cses-companion/code-changed", language, code });
  }, [language, code]);

  useEffect(() => {
    postToParent({ type: "cses-companion/ready" });

    function handleMessage(event: MessageEvent<ParentToEditorMessage>) {
      if (event.source !== window.parent) {
        return;
      }

      const message = event.data;

      if (message.type === "cses-companion/set-language") {
        setLanguage(message.language);
        setCode(codeByLanguage.current[message.language]);

        if (problemId) {
          void persist(accountId, problemId, {
            language: message.language,
            code: codeByLanguage.current,
          });
        }
      } else if (message.type === "cses-companion/set-theme") {
        setIsDark(message.isDark);
      } else if (message.type === "cses-companion/set-editor-settings") {
        setSettings(message.settings);
        void saveEditorSettings(message.settings);
      } else if (message.type === "cses-companion/request-code") {
        postToParent({ type: "cses-companion/code", language, code });
      }
    }

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, [language, code, problemId, accountId]);

  const handleChange = (value: string | undefined) => {
    const next = value ?? "";
    codeByLanguage.current[language] = next;
    setCode(next);

    if (!problemId) {
      return;
    }

    postToParent({ type: "cses-companion/save-status", status: "saving" });

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      void persist(accountId, problemId, {
        language,
        code: codeByLanguage.current,
      });
    }, SAVE_DEBOUNCE_MS);
  };

  const handleMount: OnMount = (editor) => {
    editor.focus();
  };

  return (
    <div
      className={
        isDark ? "h-screen w-screen bg-[#1e1e1e]" : "h-screen w-screen bg-white"
      }
    >
      <Editor
        language={language}
        value={code}
        theme={isDark ? "vs-dark" : "light"}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          fontSize: settings.fontSize,
          wordWrap: settings.wordWrap ? "on" : "off",
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
