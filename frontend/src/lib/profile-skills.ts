import {
  addProfileSkill,
  getProfileSkills,
  removeProfileSkills,
} from "@/api/skills";
import type { SelectedSkill, Skill } from "@/types/skill";

export function cleanSkillName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function isValidSkillName(name: string): boolean {
  const cleaned = cleanSkillName(name);
  return (
    cleaned.length > 0 &&
    [...cleaned].length <= 50 &&
    [...cleaned.toLowerCase()].length <= 50
  );
}

export async function saveProfileSkills(
  profileId: number,
  selected: SelectedSkill[],
): Promise<Skill[]> {
  // Read on every attempt: a previous save may have succeeded only partially.
  const current = await getProfileSkills(profileId);
  const saved: Skill[] = [];
  for (const skill of selected) {
    const existing = current.find((item) =>
      skill.id !== undefined
        ? item.id === skill.id
        : item.normalizedName === skill.normalizedName,
    );
    saved.push(
      existing ??
        (await addProfileSkill(
          profileId,
          skill.id !== undefined ? { id: skill.id } : { name: skill.name },
        )),
    );
  }
  const selectedIds = new Set(saved.map((skill) => skill.id));
  const removedIds = current
    .filter((skill) => !selectedIds.has(skill.id))
    .map((skill) => skill.id);
  if (removedIds.length > 0) await removeProfileSkills(profileId, removedIds);
  return saved;
}
