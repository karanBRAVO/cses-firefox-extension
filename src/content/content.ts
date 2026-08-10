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
