export function getReturnTo(
  returnTo: unknown,
  fallback = "/hackathons",
): string {
  if (
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
  ) {
    return returnTo;
  }

  return fallback;
}
