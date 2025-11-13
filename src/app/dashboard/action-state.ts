export type ProjectActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  slug?: string;
};

export const initialProjectActionState: ProjectActionState = {
  status: "idle",
};

export type ChangelogActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  projectSlug?: string;
  versionSlug?: string;
};

export const initialChangelogActionState: ChangelogActionState = {
  status: "idle",
};


