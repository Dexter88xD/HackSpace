export interface Skill {
  id: number;
  name: string;
  normalizedName: string;
}

// New skills have no ID until the form is saved.
export type SelectedSkill = Omit<Skill, "id"> & { id?: number };
