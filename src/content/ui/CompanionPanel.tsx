import { useEffect, useRef, useState } from "react";
import {
  X,
  Play,
  Send,
  Moon,
  Sun,
  Settings,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { ScrapedProblem } from "@/types/problem";
import {
  DEFAULT_EDITOR_SETTINGS,
  type EditorLanguage,
  type EditorSettings,
  type EditorToParentMessage,
} from "@/editor/protocol";
import { getCsesAccountId, isCsesLoggedIn } from "../auth";
import { executeCode } from "../execute";
import { savePendingSubmit } from "../pendingSubmit";
import { isCsesDarkMode, onCsesThemeChange } from "../theme";

interface TestCase {
  id: string;
  input: string;
}

function createTestCase(input = ""): TestCase {
  return { id: crypto.randomUUID(), input };
}

declare const browser: any;

interface CompanionPanelProps {
  problemId: string;
  problemTitle: string;
  scraped: ScrapedProblem | null;
  portalContainer: HTMLElement;
  onClose: () => void;
}

const FILENAMES: Record<EditorLanguage, string> = {
  cpp: "main.cpp",
  python: "main.py",
  java: "Main.java",
};

const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 28;

const LANGUAGE_LABELS: Record<EditorLanguage, string> = {
  cpp: "C++",
  python: "Python",
  java: "Java",
};

export default function CompanionPanel({
  problemId,
  problemTitle,
  scraped,
  portalContainer,
  onClose,
}: CompanionPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const accountIdRef = useRef(getCsesAccountId());
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsPopoverRef = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<EditorLanguage>("cpp");
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [bottomTab, setBottomTab] = useState<"tests" | "output">("tests");
  const [testCases, setTestCases] = useState<TestCase[]>(() =>
    scraped && scraped.examples.length > 0
      ? scraped.examples.map((example) => createTestCase(example.input))
      : [createTestCase()],
  );
  const [isDark, setIsDark] = useState(isCsesDarkMode());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(
    DEFAULT_EDITOR_SETTINGS,
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const savedBadgeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;
  const testCasesRef = useRef(testCases);
  testCasesRef.current = testCases;
  const themeIsManual = useRef(false);
  const pendingActionRef = useRef<"run" | "submit" | null>(null);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      // `event.target` gets retargeted to the shadow host for listeners
      // outside the shadow tree (like this one, on `document`), so it can't
      // be used to detect clicks inside our own popover. `composedPath()`
      // is unaffected by retargeting.
      const path = event.composedPath();

      if (
        (settingsPopoverRef.current &&
          path.includes(settingsPopoverRef.current)) ||
        (settingsButtonRef.current && path.includes(settingsButtonRef.current))
      ) {
        return;
      }

      setSettingsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [settingsOpen]);

  // Tailwind's `dark:` variant needs a `.dark` ancestor within the same DOM
  // tree; shadow DOM doesn't inherit classes from the host page, so this
  // toggles it on our own portal container (an ancestor of everything we
  // render, including the Select popup, which portals there too).
  useEffect(() => {
    portalContainer.classList.toggle("dark", isDark);
  }, [isDark, portalContainer]);

  useEffect(
    () =>
      onCsesThemeChange((dark) => {
        if (!themeIsManual.current) {
          setIsDark(dark);
        }
      }),
    [],
  );

  const toggleTheme = () => {
    themeIsManual.current = true;
    setIsDark((prev) => !prev);
  };

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "cses-companion/set-theme", isDark },
      "*",
    );
  }, [isDark]);

  useEffect(() => {
    function handleMessage(event: MessageEvent<EditorToParentMessage>) {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      const message = event.data;

      if (message.type === "cses-companion/ready") {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "cses-companion/set-theme", isDark: isDarkRef.current },
          "*",
        );
      } else if (message.type === "cses-companion/code-changed") {
        setLanguage(message.language);
      } else if (message.type === "cses-companion/code") {
        if (pendingActionRef.current === "submit") {
          // The submit form lives on a separate /submit/{id} page, not the
          // task page, so stash the code and navigate there; content.ts
          // picks up the pending submission and fills+submits the real
          // form once that page loads.
          void savePendingSubmit(problemId, {
            language: message.language,
            code: message.code,
          }).then(() => {
            window.location.href = `https://cses.fi/problemset/submit/${problemId}/`;
          });
        } else if (pendingActionRef.current === "run") {
          const cases = testCasesRef.current;
          setBottomTab("output");
          setIsRunning(true);
          setOutput("Running…");

          void Promise.all(
            cases.map((testCase) =>
              executeCode(message.code, message.language, testCase.input),
            ),
          ).then((results) => {
            const combined = cases
              .map((testCase, index) => {
                const result = results[index];

                return `Test case ${index + 1}\nInput:\n${testCase.input || "(empty)"}\n\nOutput:\n${result.output}`;
              })
              .join("\n\n" + "-".repeat(32) + "\n\n");

            setOutput(combined);
            setIsRunning(false);
          });
        }

        pendingActionRef.current = null;
      } else if (message.type === "cses-companion/editor-settings") {
        setEditorSettings(message.settings);
      } else if (message.type === "cses-companion/save-status") {
        setSaveStatus(message.status);

        if (savedBadgeTimeout.current) {
          clearTimeout(savedBadgeTimeout.current);
        }

        if (message.status === "saved") {
          savedBadgeTimeout.current = setTimeout(
            () => setSaveStatus("idle"),
            1500,
          );
        }
      }
    }

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, [problemId]);

  const handleLanguageChange = (next: EditorLanguage | null) => {
    if (!next) {
      return;
    }

    setLanguage(next);
    iframeRef.current?.contentWindow?.postMessage(
      { type: "cses-companion/set-language", language: next },
      "*",
    );
  };

  const handleEditorSettingsChange = (next: Partial<EditorSettings>) => {
    const merged = { ...editorSettings, ...next };
    setEditorSettings(merged);
    iframeRef.current?.contentWindow?.postMessage(
      { type: "cses-companion/set-editor-settings", settings: merged },
      "*",
    );
  };

  const addTestCase = () => {
    setTestCases((prev) => [...prev, createTestCase()]);
  };

  const removeTestCase = (id: string) => {
    setTestCases((prev) =>
      prev.length > 1 ? prev.filter((testCase) => testCase.id !== id) : prev,
    );
  };

  const updateTestCaseInput = (id: string, input: string) => {
    setTestCases((prev) =>
      prev.map((testCase) =>
        testCase.id === id ? { ...testCase, input } : testCase,
      ),
    );
  };

  const handleRun = () => {
    pendingActionRef.current = "run";
    iframeRef.current?.contentWindow?.postMessage(
      { type: "cses-companion/request-code" },
      "*",
    );
  };

  const handleSubmit = () => {
    if (!isCsesLoggedIn()) {
      window.location.href = "https://cses.fi/login";
      return;
    }

    pendingActionRef.current = "submit";
    iframeRef.current?.contentWindow?.postMessage(
      { type: "cses-companion/request-code" },
      "*",
    );
  };
  return (
    <div className="fixed z-999999 w-full h-screen flex flex-col overflow-hidden rounded-xl border-2 border-border bg-white text-black shadow-2xl dark:bg-[#1e1e1e] dark:text-white">
      {/* Header */}
      <header className="relative flex h-12 shrink-0 items-center justify-between border-b bg-neutral-100 px-4 dark:bg-neutral-900">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold">CSES Forge</div>

          <Separator orientation="vertical" className="h-5" />

          <div className="text-sm text-muted-foreground">
            #{problemId} · {problemTitle}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>

          <Button
            ref={settingsButtonRef}
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen((prev) => !prev)}
            title="Editor settings"
          >
            <Settings />
          </Button>

          <Button variant="ghost" size="icon" onClick={onClose} title="Close">
            <X />
          </Button>
        </div>

        {settingsOpen && (
          <div
            ref={settingsPopoverRef}
            className="absolute right-4 top-full z-1000000 mt-2 w-64 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-xl ring-1 ring-foreground/10"
          >
            <div className="text-sm font-semibold">Editor settings</div>

            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span>Font size</span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() =>
                      handleEditorSettingsChange({
                        fontSize: Math.max(
                          MIN_FONT_SIZE,
                          editorSettings.fontSize - 1,
                        ),
                      })
                    }
                    title="Decrease font size"
                  >
                    <Minus />
                  </Button>

                  <span className="w-6 text-center tabular-nums">
                    {editorSettings.fontSize}
                  </span>

                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() =>
                      handleEditorSettingsChange({
                        fontSize: Math.min(
                          MAX_FONT_SIZE,
                          editorSettings.fontSize + 1,
                        ),
                      })
                    }
                    title="Increase font size"
                  >
                    <Plus />
                  </Button>
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 text-xs">
                <span>Word wrap</span>

                <input
                  type="checkbox"
                  checked={editorSettings.wordWrap}
                  onChange={(event) =>
                    handleEditorSettingsChange({
                      wordWrap: event.target.checked,
                    })
                  }
                  className="size-4 cursor-pointer accent-primary"
                />
              </label>
            </div>
          </div>
        )}
      </header>

      {/* Main workspace */}
      <ResizablePanelGroup className="min-h-0 flex-1">
        {/* Problem panel */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="flex h-full flex-col">
            <div className="border-b bg-neutral-100 dark:bg-neutral-900 px-5 py-4">
              <h1 className="text-lg font-semibold">{problemTitle}</h1>

              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>CSES Problem #{problemId}</span>

                {scraped?.timeLimit && (
                  <span>Time limit: {scraped.timeLimit}</span>
                )}

                {scraped?.memoryLimit && (
                  <span>Memory limit: {scraped.memoryLimit}</span>
                )}
              </div>
            </div>

            <ScrollArea className="cses-md min-h-0 flex-1">
              <div className="p-5">
                {scraped ? (
                  <>
                    <h2 className="mb-3 text-sm font-semibold">Problem</h2>

                    <div
                      dangerouslySetInnerHTML={{
                        __html: scraped.descriptionHtml,
                      }}
                    />

                    {scraped.sections.map((section) => (
                      <div key={section.id}>
                        <h2 className="mb-3 mt-8 text-sm font-semibold">
                          {section.title}
                        </h2>

                        <div
                          dangerouslySetInnerHTML={{ __html: section.html }}
                        />
                      </div>
                    ))}

                    {scraped.examples.length > 0 && (
                      <div>
                        <h2 className="mb-3 mt-8 text-sm font-semibold">
                          Example{scraped.examples.length > 1 ? "s" : ""}
                        </h2>

                        {scraped.examples.map((example, index) => (
                          <div key={index} className="mb-4">
                            <div className="mb-1 text-xs font-medium text-muted-foreground">
                              Input
                            </div>

                            <pre className="mb-2 overflow-auto rounded-md border border-border bg-muted p-3 font-mono text-xs">
                              {example.input}
                            </pre>

                            <div className="mb-1 text-xs font-medium text-muted-foreground">
                              Output
                            </div>

                            <pre className="overflow-auto rounded-md border border-border bg-muted p-3 font-mono text-xs">
                              {example.output}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Could not load the problem statement from this page.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Editor + output */}
        <ResizablePanel defaultSize={60} minSize={30}>
          <ResizablePanelGroup orientation="vertical" className="h-full">
            <ResizablePanel defaultSize={75} minSize={30}>
              <div className="flex h-full flex-col">
                {/* Editor toolbar */}
                <div className="flex h-11 shrink-0 items-center justify-between border-b bg-neutral-100 dark:bg-neutral-900 px-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {FILENAMES[language]}
                    </span>

                    <Select
                      value={language}
                      onValueChange={handleLanguageChange}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue>{LANGUAGE_LABELS[language]}</SelectValue>
                      </SelectTrigger>

                      <SelectContent container={portalContainer}>
                        {(Object.keys(LANGUAGE_LABELS) as EditorLanguage[]).map(
                          (lang) => (
                            <SelectItem key={lang} value={lang}>
                              {LANGUAGE_LABELS[lang]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>

                    {saveStatus !== "idle" && (
                      <span className="text-xs text-muted-foreground">
                        {saveStatus === "saving" ? "Saving…" : "Saved"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRun}>
                      <Play />
                      Run
                    </Button>

                    <Button size="sm" onClick={handleSubmit}>
                      <Send />
                      Submit
                    </Button>
                  </div>
                </div>

                <div className="min-h-0 flex-1">
                  <iframe
                    ref={iframeRef}
                    src={`${browser.runtime.getURL("editor.html")}?problemId=${encodeURIComponent(problemId)}&accountId=${encodeURIComponent(accountIdRef.current)}`}
                    title="Code editor"
                    className="h-full w-full border-0"
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Test cases / Output */}
            <ResizablePanel defaultSize={25} minSize={10}>
              <Tabs
                value={bottomTab}
                onValueChange={(value) =>
                  setBottomTab(value as "tests" | "output")
                }
                className="h-full min-h-0 flex-1 gap-0"
              >
                <TabsList
                  variant="line"
                  className="h-9 w-full shrink-0 justify-start rounded-none border-b bg-neutral-100 px-2 dark:bg-neutral-900"
                >
                  <TabsTrigger value="tests">Test cases</TabsTrigger>
                  <TabsTrigger value="output">
                    Output{isRunning ? "…" : ""}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tests" className="min-h-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-3 p-3">
                      {testCases.map((testCase, index) => (
                        <div
                          key={testCase.id}
                          className="rounded-md border border-border p-2"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              Test case {index + 1}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeTestCase(testCase.id)}
                              disabled={testCases.length === 1}
                              title="Remove test case"
                            >
                              <Trash2 />
                            </Button>
                          </div>

                          <textarea
                            value={testCase.input}
                            onChange={(event) =>
                              updateTestCaseInput(
                                testCase.id,
                                event.target.value,
                              )
                            }
                            placeholder="Input"
                            rows={3}
                            className="w-full resize-y rounded-md border border-input bg-transparent p-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          />
                        </div>
                      ))}

                      <Button variant="outline" size="sm" onClick={addTestCase}>
                        <Plus />
                        Add test case
                      </Button>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="output" className="min-h-0">
                  <ScrollArea className="h-full">
                    <div className="whitespace-pre-wrap p-4 font-mono text-xs text-muted-foreground">
                      {output ?? "No output yet."}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
