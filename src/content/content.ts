import type { CSESProblem } from "../types/problem";
import { takePendingSubmit } from "./pendingSubmit";
import { scrapeProblemContent } from "./scraper";
import { submitToCses } from "./submit";
import { openCompanion } from "./ui/mount";

declare const browser: any;

console.log("CSES Forge loaded!");
console.log("Current URL:", window.location.href);

function getProblemId(): string | null {
  const match = window.location.pathname.match(/\/problemset\/task\/(\d+)/);

  return match ? match[1] : null;
}

function getSubmitPageProblemId(): string | null {
  const match = window.location.pathname.match(/\/problemset\/submit\/(\d+)/);

  return match ? match[1] : null;
}

async function autoSubmitIfPending(problemId: string) {
  const pending = await takePendingSubmit(problemId);

  if (!pending) {
    return;
  }

  const result = submitToCses(pending.code, pending.language);

  if (!result.success) {
    console.error("CSES Forge: auto-submit failed:", result.error);
  }
}

function getProblemTitle(): string | null {
  const heading = document.querySelector("h1");

  return heading?.textContent?.trim() ?? null;
}

function createCompanionButton(problem: CSESProblem) {
  const button = document.createElement("button");

  button.textContent = "CSES Forge";

  Object.assign(button.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: "999999",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#222",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "Arial, sans-serif",
    fontWeight: "600",
    cursor: "pointer",
  });

  button.addEventListener("click", () => {
    openCompanion(problem.id, problem.title, scrapeProblemContent());
  });

  document.body.appendChild(button);
}

const submitPageProblemId = getSubmitPageProblemId();

if (submitPageProblemId) {
  void autoSubmitIfPending(submitPageProblemId);
}

const problemId = getProblemId();
const problemTitle = getProblemTitle();

console.log("Problem ID:", problemId);
console.log("Problem Title:", problemTitle);

if (problemId && problemTitle) {
  const problem: CSESProblem = {
    id: problemId,
    title: problemTitle,
    url: window.location.href,
  };

  console.log("CSES Problem object:", problem);

  createCompanionButton(problem);

  browser.runtime.sendMessage({
    type: "PROBLEM_DETECTED",
    problem,
  });
}
