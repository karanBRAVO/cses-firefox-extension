declare const browser: any;

console.log("CSES Forge background loaded!");

const WANDBOX_COMPILERS: Record<string, string> = {
  cpp: "gcc-13.2.0",
  python: "cpython-3.12.7",
  java: "openjdk-jdk-21+35",
};

const EXECUTE_TIMEOUT_MS = 15000;

// Wandbox always compiles Java as `prog.java`, so the top-level class must
// be named `prog` for `java prog` to find it. This only affects the
// sandboxed test-run request sent here, not the code submitted to CSES.
function prepareJavaCode(code: string): string {
  return code.replace(
    /(\bpublic\s+)?\bclass\s+\w+/,
    (_match, publicModifier) => `${publicModifier ?? ""}class prog`,
  );
}

async function executeOnWandbox(
  code: string,
  language: string,
  input: string,
): Promise<{ output: string }> {
  const compiler = WANDBOX_COMPILERS[language];

  if (!compiler) {
    return { output: `Unsupported language: ${language}` };
  }

  const preparedCode = language === "java" ? prepareJavaCode(code) : code;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXECUTE_TIMEOUT_MS);

  try {
    const response = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: preparedCode, compiler, stdin: input }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { output: `Execution service error (HTTP ${response.status}).` };
    }

    const result = await response.json();

    if (result.compiler_error) {
      return { output: `Compile error:\n${result.compiler_error}` };
    }

    if (result.status !== "0") {
      return {
        output: `Runtime error (exit code ${result.status}):\n${result.program_error || "(no output)"}`,
      };
    }

    return { output: result.program_output || "(no output)" };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { output: "Execution timed out." };
    }

    return {
      output: `Failed to reach execution service: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

browser.runtime.onMessage.addListener((message: any) => {
  console.log("Message received from content script:", message);

  if (message.type === "PROBLEM_DETECTED") {
    console.log("Detected CSES problem:", message.problem);
    return;
  }

  if (message.type === "EXECUTE_CODE") {
    return executeOnWandbox(message.code, message.language, message.input);
  }
});
