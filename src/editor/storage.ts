import type { EditorLanguage, EditorSettings } from "./protocol";

declare const browser: any;

export interface StoredProblemCode {
  language: EditorLanguage;
  code: Partial<Record<EditorLanguage, string>>;
}

// Namespaced by CSES account (see getCsesAccountId in content/auth.ts) so
// switching accounts in the same browser doesn't show one account's code
// under another's.
function storageKey(accountId: string, problemId: string) {
  return `cses-companion:code:${accountId}:${problemId}`;
}

export async function loadStoredCode(
  accountId: string,
  problemId: string,
): Promise<StoredProblemCode | null> {
  const key = storageKey(accountId, problemId);
  const result = await browser.storage.local.get(key);

  return result[key] ?? null;
}

export async function saveStoredCode(
  accountId: string,
  problemId: string,
  data: StoredProblemCode,
): Promise<void> {
  await browser.storage.local.set({ [storageKey(accountId, problemId)]: data });
}

const SETTINGS_KEY = "cses-companion:editor-settings";

export async function loadEditorSettings(): Promise<Partial<EditorSettings> | null> {
  const result = await browser.storage.local.get(SETTINGS_KEY);

  return result[SETTINGS_KEY] ?? null;
}

export async function saveEditorSettings(
  settings: EditorSettings,
): Promise<void> {
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
}
