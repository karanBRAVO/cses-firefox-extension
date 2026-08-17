export function isCsesDarkMode(): boolean {
  const el = document.getElementById("darkmode-enabled");

  if (!el?.textContent) {
    return false;
  }

  try {
    return Boolean(JSON.parse(el.textContent));
  } catch {
    return false;
  }
}

export function onCsesThemeChange(
  callback: (isDark: boolean) => void,
): () => void {
  const handler = () => callback(isCsesDarkMode());

  document.addEventListener("theme-changed", handler);

  return () => document.removeEventListener("theme-changed", handler);
}
