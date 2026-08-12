import type { CSESProblem } from "../types/problem";

declare const browser: any;

console.log("CSES Companion loaded!");
console.log("Current URL:", window.location.href);

function createCompanionButton(problem: CSESProblem) {
  const button = document.createElement("button");

  button.textContent = "CSES Companion";

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
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
  });

  button.addEventListener("mouseenter", () => {
    button.style.background = "#444";
  });

  button.addEventListener("mouseleave", () => {
    button.style.background = "#222";
  });

  button.addEventListener("click", () => {
    console.log("CSES Companion clicked!");

    alert(`Problem: ${problem.title}\nProblem ID: ${problem.id}`);
  });

  document.body.appendChild(button);
}

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

  createCompanionButton(problem);

  browser.runtime.sendMessage({
    type: "PROBLEM_DETECTED",
    problem,
  });
}
