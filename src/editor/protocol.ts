export type EditorLanguage = "cpp" | "python" | "java";

export interface EditorSettings {
  fontSize: number;
  wordWrap: boolean;
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 13,
  wordWrap: false,
};

export type ParentToEditorMessage =
  | { type: "cses-companion/set-language"; language: EditorLanguage }
  | { type: "cses-companion/set-theme"; isDark: boolean }
  | { type: "cses-companion/set-editor-settings"; settings: EditorSettings }
  | { type: "cses-companion/request-code" };

export type EditorToParentMessage =
  | { type: "cses-companion/ready" }
  | {
      type: "cses-companion/code-changed";
      language: EditorLanguage;
      code: string;
    }
  | { type: "cses-companion/code"; language: EditorLanguage; code: string }
  | { type: "cses-companion/save-status"; status: "saving" | "saved" }
  | { type: "cses-companion/editor-settings"; settings: EditorSettings };
