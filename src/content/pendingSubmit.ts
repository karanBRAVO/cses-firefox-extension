import type { EditorLanguage } from "../editor/protocol";

declare const browser: any;

export interface PendingSubmit {
  language: EditorLanguage;
  code: string;
}

function pendingSubmitKey(problemId: string) {
  return `cses-companion:pending-submit:${problemId}`;
}

export async function savePendingSubmit(
  problemId: string,
  data: PendingSubmit,
): Promise<void> {
  await browser.storage.local.set({ [pendingSubmitKey(problemId)]: data });
}

export async function takePendingSubmit(
  problemId: string,
): Promise<PendingSubmit | null> {
  const key = pendingSubmitKey(problemId);
  const result = await browser.storage.local.get(key);
  const value = result[key] ?? null;

  if (value) {
    await browser.storage.local.remove(key);
  }

  return value;
}
