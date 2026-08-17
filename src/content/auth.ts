function getAccountHref(): string | null {
  const accountLink = document.querySelector<HTMLAnchorElement>(".account");

  return accountLink?.getAttribute("href") ?? null;
}

export function isCsesLoggedIn(): boolean {
  const href = getAccountHref();

  return href !== null && href !== "/login";
}

// Used to namespace per-account data (like saved code) so switching CSES
// accounts in the same browser doesn't leak one account's code into
// another's. The account link's href (e.g. "/user/12345") is stable and
// unique per account; "anonymous" covers the logged-out case.
export function getCsesAccountId(): string {
  const href = getAccountHref();

  return href && href !== "/login" ? href : "anonymous";
}
