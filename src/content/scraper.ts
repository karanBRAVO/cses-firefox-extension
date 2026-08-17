import type {
  ProblemExample,
  ProblemSection,
  ScrapedProblem,
} from "../types/problem";

function extractLimit(
  constraintsList: Element | null,
  label: string,
): string | null {
  const items = constraintsList
    ? Array.from(constraintsList.querySelectorAll("li"))
    : [];
  const item = items.find((li) => li.textContent?.includes(label));

  return item?.textContent?.replace(label, "").trim() ?? null;
}

function parseExamples(sections: ProblemSection[]): ProblemExample[] {
  const exampleSection = sections.find((section) =>
    section.id.startsWith("example"),
  );

  if (!exampleSection) {
    return [];
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = exampleSection.html;

  const pres = Array.from(wrapper.querySelectorAll("pre"));
  const examples: ProblemExample[] = [];

  for (let i = 0; i + 1 < pres.length; i += 2) {
    examples.push({
      input: pres[i].textContent ?? "",
      output: pres[i + 1].textContent ?? "",
    });
  }

  return examples;
}

export function scrapeProblemContent(): ScrapedProblem | null {
  const md = document.querySelector(".content .md");

  if (!md) {
    return null;
  }

  const constraintsList = document.querySelector(".content .task-constraints");
  const timeLimit = extractLimit(constraintsList, "Time limit:");
  const memoryLimit = extractLimit(constraintsList, "Memory limit:");

  const descriptionNodes: Element[] = [];
  const sections: ProblemSection[] = [];

  let current: { id: string; title: string; nodes: Element[] } | null = null;

  for (const child of Array.from(md.children)) {
    if (child.tagName === "H1") {
      if (current) {
        sections.push({
          id: current.id,
          title: current.title,
          html: current.nodes.map((node) => node.outerHTML).join(""),
        });
      }

      current = {
        id: child.id,
        title: child.textContent?.trim() ?? "",
        nodes: [],
      };
    } else if (current) {
      current.nodes.push(child);
    } else {
      descriptionNodes.push(child);
    }
  }

  if (current) {
    sections.push({
      id: current.id,
      title: current.title,
      html: current.nodes.map((node) => node.outerHTML).join(""),
    });
  }

  return {
    timeLimit,
    memoryLimit,
    descriptionHtml: descriptionNodes.map((node) => node.outerHTML).join(""),
    sections: sections.filter((section) => !section.id.startsWith("example")),
    examples: parseExamples(sections),
  };
}
