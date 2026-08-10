import type { CSESProblem } from "../types/problem";

declare const browser: any;

console.log("CSES Companion loaded!");
console.log("Current URL:", window.location.href);

function getProblemId(): string | null {
  const match = window.location.pathname.match(/\/problemset\/task\/(\d+)/);

  return match ? match[1] : null;
}

function getProblemTitle(): string | null {
  const heading = document.querySelector("h1");

  return heading?.textContent?.trim() ?? null;
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

  browser.runtime.sendMessage({
    type: "PROBLEM_DETECTED",
    problem,
  });
}
