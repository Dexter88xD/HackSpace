export function parseHackathonId(id: string | undefined): number | null {
  if (id === undefined || !/^[1-9]\d*$/.test(id)) {
    return null;
  }

  const hackathonId = Number(id);

  return Number.isSafeInteger(hackathonId) ? hackathonId : null;
}
