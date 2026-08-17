import type { EditorLanguage } from "../editor/protocol";

const CSES_LANGUAGE: Record<EditorLanguage, string> = {
  cpp: "C++",
  python: "Python3",
  java: "Java",
};

const FILE_EXTENSIONS: Record<EditorLanguage, string> = {
  cpp: "cpp",
  python: "py",
  java: "java",
};

export interface SubmitResult {
  success: boolean;
  error?: string;
}

export function submitToCses(
  code: string,
  language: EditorLanguage,
): SubmitResult {
  const form = document.querySelector<HTMLFormElement>(
    'form[action="/course/send.php"]',
  );

  if (!form) {
    return {
      success: false,
      error: "Could not find the CSES submit form on this page.",
    };
  }

  const langSelect = form.querySelector<HTMLSelectElement>(
    'select[name="lang"]',
  );
  const fileInput = form.querySelector<HTMLInputElement>('input[name="file"]');

  if (!langSelect || !fileInput) {
    return {
      success: false,
      error: "The CSES submit form is missing expected fields.",
    };
  }

  // Setting `lang` and dispatching `change` lets CSES's own page script
  // (checkSelects) repopulate the dependent `option` sub-select (compiler
  // version, e.g. C++20) and its per-language default, exactly as if the
  // user had picked it themselves.
  langSelect.value = CSES_LANGUAGE[language];
  langSelect.dispatchEvent(new Event("change", { bubbles: true }));

  // `input[type=file].value` can't be set directly (browser security), so
  // a File is attached via DataTransfer instead. We deliberately don't
  // dispatch a `change` event here: CSES's page script re-detects the
  // language from the filename on file `change`, which would race with
  // (and could override) the explicit language we just set above.
  const fileName = `main.${FILE_EXTENSIONS[language]}`;
  const file = new File([code], fileName, { type: "text/plain" });
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;

  form.requestSubmit();

  return { success: true };
}
