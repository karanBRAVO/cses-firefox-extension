export interface CSESProblem {
  id: string;
  title: string;
  url: string;
}

export interface ProblemExample {
  input: string;
  output: string;
}

export interface ProblemSection {
  id: string;
  title: string;
  html: string;
}

export interface ScrapedProblem {
  timeLimit: string | null;
  memoryLimit: string | null;
  descriptionHtml: string;
  sections: ProblemSection[];
  examples: ProblemExample[];
}
