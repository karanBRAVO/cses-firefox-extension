import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="fixed top-5 right-5 z-999999 h-125 w-105 overflow-hidden rounded-xl bg-[#1e1e1e] text-white shadow-2xl">
      <div className="flex h-13 items-center justify-between border-b border-[#333] px-4">
        <div>
          <div className="text-sm font-semibold">CSES Companion</div>

          <div className="text-[11px] text-[#888]">#{problemId}</div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose}>
          <X />
        </Button>
      </div>

      <div className="p-5">
        <h2 className="mb-2 text-xl font-semibold">{problemTitle}</h2>

        <div className="mt-7 rounded-lg bg-[#252526] p-8 text-center text-[#888]">
          Editor coming soon...
        </div>
      </div>
    </div>
  );
}
