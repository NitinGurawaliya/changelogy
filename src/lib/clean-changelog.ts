const BULLET_PATTERN = /^(?:[-*•]\s+|\d+[.)]\s+)/;
const MARKDOWN_HEADING_PATTERN = /^#{1,6}\s+/; // Matches #, ##, ###, etc. followed by space
const MARKDOWN_HEADING_PATTERN_LOOSE = /^#{1,6}/; // Matches #, ##, ###, etc. even without space
const MARKDOWN_CODE_BLOCK_PATTERN = /^```/; // Matches code block fences
const MARKDOWN_LINK_PATTERN = /\[.*?\]\(.*?\)/; // Matches markdown links
const MARKDOWN_IMAGE_PATTERN = /!\[.*?\]\(.*?\)/; // Matches markdown images

const sentenceCase = (input: string) => {
  if (input.length === 0) {
    return input;
  }

  return input[0].toUpperCase() + input.slice(1);
};

/**
 * Checks if the content appears to be markdown formatted
 * (contains markdown syntax like headings, code blocks, etc.)
 */
function isMarkdownFormatted(content: string): boolean {
  const trimmedContent = content.trim();
  
  // Check if content starts with markdown heading (most common case for AI-generated changelogs)
  if (MARKDOWN_HEADING_PATTERN_LOOSE.test(trimmedContent)) {
    return true;
  }
  
  const lines = content.split("\n");
  let headingCount = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Count markdown syntax patterns
    if (MARKDOWN_HEADING_PATTERN_LOOSE.test(trimmed)) headingCount++;
    if (MARKDOWN_CODE_BLOCK_PATTERN.test(trimmed)) return true;
    if (MARKDOWN_LINK_PATTERN.test(trimmed)) return true;
    if (MARKDOWN_IMAGE_PATTERN.test(trimmed)) return true;
    
    // If we find multiple markdown headings, it's definitely markdown
    if (headingCount >= 2) return true;
  }
  
  // If content starts with a heading, treat as markdown
  return headingCount > 0;
}

export function cleanChangelogText(raw: string) {
  const normalized = raw.replace(/\r\n?/g, "\n").trim();

  if (normalized.length === 0) {
    return "";
  }

  // If the content appears to be markdown formatted (like AI-generated changelogs),
  // preserve it as-is and only clean up excessive blank lines
  if (isMarkdownFormatted(normalized)) {
    return normalized.replace(/\n{3,}/g, "\n\n").trim();
  }

  // For plain text content (manual entry), apply formatting
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

    // Preserve markdown syntax even in manual entry
    if (MARKDOWN_HEADING_PATTERN_LOOSE.test(trimmed) || 
        MARKDOWN_CODE_BLOCK_PATTERN.test(trimmed) ||
        MARKDOWN_LINK_PATTERN.test(trimmed) ||
        MARKDOWN_IMAGE_PATTERN.test(trimmed)) {
      cleaned.push(trimmed);
      continue;
    }

    cleaned.push(sentenceCase(trimmed));
  }

  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n");
}


