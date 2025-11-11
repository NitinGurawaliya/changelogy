const BULLET_PATTERN = /^(?:[-*•]\s+|\d+[.)]\s+)/;

const sentenceCase = (input: string) => {
  if (input.length === 0) {
    return input;
  }

  return input[0].toUpperCase() + input.slice(1);
};

export function cleanChangelogText(raw: string) {
  const normalized = raw.replace(/\r\n?/g, "\n").trim();

  if (normalized.length === 0) {
    return "";
  }

  const lines = normalized.split("\n");
  const cleaned: string[] = [];
  let previousBlank = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      if (!previousBlank && cleaned.length > 0) {
        cleaned.push("");
        previousBlank = true;
      }
      continue;
    }

    previousBlank = false;

    if (BULLET_PATTERN.test(trimmed)) {
      const text = trimmed.replace(BULLET_PATTERN, "").trim();
      cleaned.push(`- ${sentenceCase(text)}`);
      continue;
    }

    cleaned.push(sentenceCase(trimmed));
  }

  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n");
}


