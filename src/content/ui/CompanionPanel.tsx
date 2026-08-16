import { X, Play, Send, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CompanionPanelProps {
  problemId: string;
  problemTitle: string;
  onClose: () => void;
}

export default function CompanionPanel({
  problemId,
  problemTitle,
  onClose,
}: CompanionPanelProps) {
  return (
    <div className="fixed inset-4 z-999999 flex flex-col overflow-hidden rounded-xl border border-border bg-white text-black shadow-2xl dark:bg-[#1e1e1e] dark:text-white">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold">CSES Companion</div>

          <Separator orientation="vertical" className="h-5" />

          <div className="text-sm text-muted-foreground">
            #{problemId} · {problemTitle}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Settings">
            <Settings />
          </Button>

          <Button variant="ghost" size="icon" onClick={onClose} title="Close">
            <X />
          </Button>
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex min-h-0 flex-1">
        {/* Problem panel */}
        <section className="w-[40%] min-w-75 border-r">
          <div className="flex h-full flex-col">
            <div className="border-b px-5 py-4">
              <h1 className="text-lg font-semibold">{problemTitle}</h1>

              <p className="mt-1 text-xs text-muted-foreground">
                CSES Problem #{problemId}
              </p>
            </div>

            <div className="flex-1 overflow-auto p-5">
              <h2 className="mb-3 text-sm font-semibold">Problem</h2>

              <p className="text-sm leading-6 text-muted-foreground">
                The problem statement will be extracted from the CSES page and
                displayed here.
              </p>

              <h2 className="mb-3 mt-8 text-sm font-semibold">Input</h2>

              <p className="text-sm leading-6 text-muted-foreground">
                Input description will appear here.
              </p>

              <h2 className="mb-3 mt-8 text-sm font-semibold">Output</h2>

              <p className="text-sm leading-6 text-muted-foreground">
                Output description will appear here.
              </p>
            </div>
          </div>
        </section>

        {/* Editor */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Editor toolbar */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b px-3">
            <div className="text-xs text-muted-foreground">main.cpp</div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Play />
                Run
              </Button>

              <Button size="sm">
                <Send />
                Submit
              </Button>
            </div>
          </div>

          {/* Editor placeholder */}
          <div className="flex flex-1 items-center justify-center bg-[#181818]">
            <div className="text-center">
              <div className="text-sm font-medium">Monaco Editor</div>

              <div className="mt-1 text-xs text-muted-foreground">
                Coming next
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Output */}
      <section className="h-36 shrink-0 border-t bg-white dark:bg-[#1e1e1e]">
        <div className="flex h-9 items-center border-b px-4">
          <span className="text-xs font-medium">Output</span>
        </div>

        <div className="p-4 font-mono text-xs text-muted-foreground">
          No output yet.
        </div>
      </section>
    </div>
  );
}
