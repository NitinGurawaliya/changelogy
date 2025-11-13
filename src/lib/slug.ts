const NON_ALPHANUMERIC = /[^a-z0-9]+/gi;
const HYPHEN_DUPLICATES = /-{2,}/g;

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, "-")
    .replace(HYPHEN_DUPLICATES, "-")
    .replace(/^-+|-+$/g, "");
}

