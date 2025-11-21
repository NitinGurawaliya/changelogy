import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";

type Commit = {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
  date: string;
};

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { commits, projectName, versionLabel }: { commits: Commit[]; projectName: string; versionLabel: string } =
      body;

    if (!commits || !Array.isArray(commits) || commits.length === 0) {
      return NextResponse.json({ error: "Commits are required" }, { status: 400 });
    }

    if (!projectName || !versionLabel) {
      return NextResponse.json({ error: "Project name and version label are required" }, { status: 400 });
    }

    // Limit commits to prevent token limit issues (max 50 commits per request)
    const MAX_COMMITS = 50;
    const commitsToProcess = commits.length > MAX_COMMITS ? commits.slice(0, MAX_COMMITS) : commits;
    
    if (commits.length > MAX_COMMITS) {
      console.warn(`Too many commits (${commits.length}), limiting to ${MAX_COMMITS} for token limit`);
    }

    // Process and prepare commits for AI with structured format (title, description, context)
    const processedCommits = processCommits(commitsToProcess);
    const formattedCommits = formatCommitsForAI(processedCommits);

    // Call AI API to generate changelog
    const aiApiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    if (!aiApiKey) {
      // Fallback: Generate a basic changelog without AI
      const changelogContent = generateBasicChangelog(commits, versionLabel);
      return NextResponse.json({ changelog: changelogContent });
    }

    // Try OpenAI first, then Anthropic, fallback to basic
    let changelog: string;
    let aiUsed = false;
    let fallbackReason: string | null = null;
    
    try {
      if (process.env.OPENAI_API_KEY) {
        try {
          changelog = await generateWithOpenAI(formattedCommits, processedCommits, commitsToProcess, projectName, versionLabel);
          aiUsed = true;
        } catch (openaiError: any) {
          // If OpenAI fails with quota error, try Anthropic if available
          if ((openaiError.isQuotaError || openaiError.message?.includes("quota") || openaiError.message?.includes("insufficient_quota")) && process.env.ANTHROPIC_API_KEY) {
            console.log("OpenAI quota exceeded, trying Anthropic...");
            fallbackReason = "OpenAI quota exceeded, trying Anthropic";
            try {
              changelog = await generateWithAnthropic(formattedCommits, processedCommits, commitsToProcess, projectName, versionLabel);
              aiUsed = true;
              fallbackReason = null; // Anthropic worked
            } catch (anthropicError: any) {
              // If Anthropic also fails, fall through to outer catch
              fallbackReason = "Both OpenAI and Anthropic failed";
              throw anthropicError;
            }
          } else {
            throw openaiError;
          }
        }
      } else if (process.env.ANTHROPIC_API_KEY) {
        changelog = await generateWithAnthropic(formattedCommits, processedCommits, commitsToProcess, projectName, versionLabel);
        aiUsed = true;
      } else {
        // No API key configured, use basic generation
        fallbackReason = "No AI API key configured";
        changelog = generateBasicChangelog(commitsToProcess, versionLabel);
      }

      // Post-process the changelog to ensure quality
      changelog = postProcessChangelog(changelog, versionLabel);
    } catch (aiError: any) {
      // If AI generation fails, fallback to basic changelog
      console.error("AI generation failed, falling back to basic changelog:", aiError);
      
      if (aiError.message?.includes("quota") || aiError.message?.includes("insufficient_quota")) {
        fallbackReason = "AI API quota exceeded";
      } else if (aiError.message?.includes("token") || aiError.message?.includes("context_length")) {
        fallbackReason = "Token limit exceeded - too many commits. Try selecting fewer commits.";
      } else if (aiError.message?.includes("API key")) {
        fallbackReason = "AI API key not configured or invalid";
      } else {
        fallbackReason = "AI generation failed";
      }
      
      changelog = generateBasicChangelog(commitsToProcess, versionLabel);
    }

    return NextResponse.json({ 
      changelog,
      aiUsed,
      fallbackReason: fallbackReason && !aiUsed ? fallbackReason : null,
    });
  } catch (error) {
    console.error("Error generating changelog:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate changelog";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function processCommits(commits: Commit[]): { title: string; description: string; context: string }[] {
  return commits.map((commit) => {
    // Extract title (first line) and description (body)
    const lines = commit.message.split("\n");
    const title = lines[0].trim();
    
    // Extract description from commit body
    const bodyLines = lines.slice(1).filter(line => {
      const trimmed = line.trim();
      // Skip empty lines, merge messages, and co-authored-by lines
      return (
        trimmed.length > 0 &&
        !trimmed.toLowerCase().startsWith("merge") &&
        !trimmed.toLowerCase().startsWith("co-authored-by") &&
        !trimmed.toLowerCase().startsWith("signed-off-by")
      );
    });
    
    const description = bodyLines
      .slice(0, 5) // Limit to first 5 lines to avoid token bloat
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n")
      .trim();
    
    // Build context information
    const contextParts: string[] = [];
    if (commit.author.name) {
      contextParts.push(`Author: ${commit.author.name}`);
    }
    if (commit.date) {
      const commitDate = new Date(commit.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      contextParts.push(`Date: ${commitDate}`);
    }
    const context = contextParts.length > 0 ? contextParts.join(" | ") : "";
    
    return {
      title,
      description: description || "",
      context,
    };
  });
}

function formatCommitsForAI(processedCommits: { title: string; description: string; context: string }[]): string {
  // Format commits in a structured way that AI can easily parse
  // This format helps AI understand each part clearly
  return processedCommits
    .map((commit, index) => {
      let formatted = `[Commit ${index + 1}]\n`;
      formatted += `Title: ${commit.title}\n`;
      
      if (commit.description && commit.description.trim().length > 0) {
        formatted += `Description:\n${commit.description}\n`;
      } else {
        formatted += `Description: (No additional details provided)\n`;
      }
      
      if (commit.context) {
        formatted += `Context: ${commit.context}\n`;
      }
      
      return formatted;
    })
    .join("\n\n---\n\n");
}

function postProcessChangelog(changelog: string, versionLabel: string): string {
  // Ensure the changelog starts with the version header
  let processed = changelog.trim();
  
  // Remove any leading/trailing whitespace
  processed = processed.replace(/^\s+|\s+$/g, "");
  
  // Ensure it starts with a header
  if (!processed.startsWith("#")) {
    processed = `## ${versionLabel}\n\n${processed}`;
  }
  
  // Ensure consistent line breaks
  processed = processed.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  // Normalize multiple blank lines
  processed = processed.replace(/\n{3,}/g, "\n\n");
  
  // Ensure proper markdown formatting
  // Fix any bullet points that might be missing dashes
  processed = processed.replace(/^(\s*)[•·]\s+/gm, "$1- ");
  
  return processed;
}

async function generateWithOpenAI(
  formattedCommits: string,
  processedCommits: { title: string; description: string; context: string }[],
  originalCommits: Commit[],
  projectName: string,
  versionLabel: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  try {
    const systemPrompt = `You are an expert technical writer specializing in creating professional, user-friendly changelogs from Git commit messages.

Your task is to transform raw commit messages into a well-structured, readable changelog entry.

IMPORTANT - READ EACH COMMIT CAREFULLY:
1. Read the TITLE (first line) - this is the main summary of the change
2. Read the DESCRIPTION (body) - this provides additional context and details about the change
3. Read the CONTEXT (author, date) - this helps understand the timeline and contributors
4. Consider all three parts together to understand the full picture of each change

GUIDELINES:
1. Group related changes into logical categories: Added, Changed, Fixed, Removed, Security, Performance, etc.
2. Write in present tense and active voice
3. Focus on user impact - explain what changed and why it matters
4. Be concise but descriptive
5. Use clear, non-technical language where possible
6. Use information from BOTH title and description to create comprehensive changelog entries
7. If a commit has a description, incorporate those details into the changelog entry
8. Remove redundant information (like "fix typo", "update readme")
9. Merge similar commits into a single bullet point
10. Prioritize user-facing changes over internal refactoring

FORMAT:
- Use Markdown with ## for version heading, ### for sections
- Use bullet points (-) for each change
- Include a brief summary if helpful
- Make each entry informative by combining title and description information

EXAMPLE OUTPUT:
\`\`\`markdown
## v1.2.0

### Added
- New dark mode theme for better visibility in low-light environments
- Export functionality to PDF and CSV formats
- Keyboard shortcuts for power users (press ? to view all shortcuts)

### Changed
- Improved dashboard loading speed by 40% through optimized queries
- Updated user profile page with enhanced customization options

### Fixed
- Resolved issue where notifications were not appearing on mobile devices
- Fixed data loss bug when editing long-form content

### Security
- Updated authentication flow to use more secure token validation
\`\`\``;

    const userPrompt = `Create a professional changelog for "${projectName}" version "${versionLabel}".

Here are ${originalCommits.length} commit${originalCommits.length > 1 ? "s" : ""} with their titles, descriptions, and context:

${formattedCommits}

CRITICAL INSTRUCTIONS:
1. Read the TITLE of each commit to understand what was done
2. Read the DESCRIPTION (if present) to get additional context and details
3. Use the CONTEXT information to understand the timeline
4. Combine information from title AND description to create comprehensive, informative changelog entries
5. Don't just copy the title - enhance it with details from the description
6. Analyze all commits and group them logically into sections
7. Rewrite in user-friendly language, removing technical jargon where possible
8. Focus on what users will notice and benefit from
9. Organize into appropriate sections (Added, Changed, Fixed, Removed, Security, Performance, etc.)
10. Use the version label "${versionLabel}" in the heading
11. Ensure the changelog is professional and ready to publish

Generate ONLY the markdown changelog content, starting with "## ${versionLabel}".`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo", // Default to cheaper model, can override with env var
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500, // Reduced from 2000 to prevent token limit issues
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      console.error("OpenAI API error:", response.status, errorData);
      
      const errorMessage = errorData.error?.message || "Failed to generate changelog";
      const error = new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
      
      // Add quota flag for easier detection
      if (response.status === 429 && errorData.error?.code === "insufficient_quota") {
        (error as any).isQuotaError = true;
      }
      
      throw error;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received from OpenAI");
    }
    
    return content.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while calling OpenAI API");
  }
}

async function generateWithAnthropic(
  formattedCommits: string,
  processedCommits: { title: string; description: string; context: string }[],
  originalCommits: Commit[],
  projectName: string,
  versionLabel: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error("Anthropic API key is not configured");
  }

  const systemPrompt = `You are an expert technical writer specializing in creating professional, user-friendly changelogs from Git commit messages.

Your task is to transform raw commit messages into a well-structured, readable changelog entry.

IMPORTANT - READ EACH COMMIT CAREFULLY:
1. Read the TITLE (first line) - this is the main summary of the change
2. Read the DESCRIPTION (body) - this provides additional context and details about the change
3. Read the CONTEXT (author, date) - this helps understand the timeline and contributors
4. Consider all three parts together to understand the full picture of each change

GUIDELINES:
1. Group related changes into logical categories: Added, Changed, Fixed, Removed, Security, Performance, etc.
2. Write in present tense and active voice
3. Focus on user impact - explain what changed and why it matters
4. Be concise but descriptive
5. Use clear, non-technical language where possible
6. Use information from BOTH title and description to create comprehensive changelog entries
7. If a commit has a description, incorporate those details into the changelog entry
8. Remove redundant information (like "fix typo", "update readme")
9. Merge similar commits into a single bullet point
10. Prioritize user-facing changes over internal refactoring

FORMAT:
- Use Markdown with ## for version heading, ### for sections
- Use bullet points (-) for each change
- Include a brief summary if helpful
- Make each entry informative by combining title and description information`;

  const userPrompt = `Create a professional changelog for "${projectName}" version "${versionLabel}".

Here are ${originalCommits.length} commit${originalCommits.length > 1 ? "s" : ""} with their titles, descriptions, and context:

${formattedCommits}

CRITICAL INSTRUCTIONS:
1. Read the TITLE of each commit to understand what was done
2. Read the DESCRIPTION (if present) to get additional context and details
3. Use the CONTEXT information to understand the timeline
4. Combine information from title AND description to create comprehensive, informative changelog entries
5. Don't just copy the title - enhance it with details from the description
6. Analyze all commits and group them logically into sections
7. Rewrite in user-friendly language, removing technical jargon where possible
8. Focus on what users will notice and benefit from
9. Organize into appropriate sections (Added, Changed, Fixed, Removed, Security, Performance, etc.)
10. Use the version label "${versionLabel}" in the heading
11. Ensure the changelog is professional and ready to publish

Generate ONLY the markdown changelog content, starting with "## ${versionLabel}".`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500, // Reduced from 2000 to prevent token limit issues
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      console.error("Anthropic API error:", response.status, errorData);
      throw new Error(
        `Anthropic API error (${response.status}): ${errorData.error?.message || "Failed to generate changelog"}`
      );
    }

    const data = await response.json();
    const content = data.content[0]?.text;
    
    if (!content) {
      throw new Error("No content received from Anthropic");
    }
    
    return content.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while calling Anthropic API");
  }
}

function generateBasicChangelog(commits: Commit[], versionLabel: string): string {
  if (commits.length === 0) {
    return `## ${versionLabel}\n\nNo changes documented.`;
  }

  const lines = [`## ${versionLabel}\n`];

  // Group commits by type (basic categorization)
  const added: string[] = [];
  const fixed: string[] = [];
  const changed: string[] = [];
  const other: string[] = [];

  commits.forEach((commit) => {
    const msg = commit.message.split("\n")[0].trim(); // Take first line only
    const lowerMsg = msg.toLowerCase();

    // Enhanced categorization
    if (
      lowerMsg.includes("add") ||
      lowerMsg.includes("new") ||
      lowerMsg.includes("feature") ||
      lowerMsg.includes("implement") ||
      lowerMsg.startsWith("feat:")
    ) {
      added.push(msg);
    } else if (
      lowerMsg.includes("fix") ||
      lowerMsg.includes("bug") ||
      lowerMsg.includes("error") ||
      lowerMsg.includes("issue") ||
      lowerMsg.startsWith("fix:")
    ) {
      fixed.push(msg);
    } else if (
      lowerMsg.includes("update") ||
      lowerMsg.includes("change") ||
      lowerMsg.includes("improve") ||
      lowerMsg.includes("refactor") ||
      lowerMsg.includes("enhance") ||
      lowerMsg.startsWith("chore:") ||
      lowerMsg.startsWith("refactor:")
    ) {
      changed.push(msg);
    } else {
      other.push(msg);
    }
  });

  if (added.length > 0) {
    lines.push("### Added\n");
    added.forEach((msg) => lines.push(`- ${msg}`));
    lines.push("");
  }

  if (changed.length > 0) {
    lines.push("### Changed\n");
    changed.forEach((msg) => lines.push(`- ${msg}`));
    lines.push("");
  }

  if (fixed.length > 0) {
    lines.push("### Fixed\n");
    fixed.forEach((msg) => lines.push(`- ${msg}`));
    lines.push("");
  }

  if (other.length > 0) {
    lines.push("### Other\n");
    other.forEach((msg) => lines.push(`- ${msg}`));
    lines.push("");
  }

  return lines.join("\n");
}
