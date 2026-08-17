import type { EditorLanguage } from "../editor/protocol";

declare const browser: any;

export interface ExecutionResult {
  output: string;
}

// The actual request runs in the background script rather than here, since
// content-script fetches are subject to the host page's CSP, while the
// background script isn't.
export async function executeCode(
  code: string,
  language: EditorLanguage,
  input: string,
): Promise<ExecutionResult> {
  return browser.runtime.sendMessage({
    type: "EXECUTE_CODE",
    code,
    language,
    input,
  });
}
