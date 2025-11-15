const ICON_REL_VALUES = ["icon", "shortcut icon", "apple-touch-icon", "mask-icon"];
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function ensureProtocol(url: string) {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) {
    return url;
  }

  return `https://${url}`;
}

function toAbsoluteUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

function extractLinkIcon(html: string, baseUrl: string) {
  const linkRegex = /<link\b[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html))) {
    const tag = match[0];
    const relMatch = tag.match(/\brel\s*=\s*["']?([^"'>]+)/i);
    if (!relMatch) {
      continue;
    }

    const relValue = relMatch[1].toLowerCase();
    if (!ICON_REL_VALUES.some((rel) => relValue.includes(rel))) {
      continue;
    }

    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) {
      continue;
    }

    const absolute = toAbsoluteUrl(hrefMatch[1].trim(), baseUrl);
    if (absolute) {
      return absolute;
    }
  }

  return null;
}

function extractOgImage(html: string, baseUrl: string) {
  const ogRegex = /<meta\b[^>]*property\s*=\s*["']og:image["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = ogRegex.exec(html))) {
    const tag = match[0];
    const contentMatch = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i);
    if (!contentMatch) {
      continue;
    }

    const absolute = toAbsoluteUrl(contentMatch[1].trim(), baseUrl);
    if (absolute) {
      return absolute;
    }
  }

  return null;
}

function googleFaviconUrl(baseUrl: string) {
  try {
    const origin = new URL(baseUrl).origin;
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(origin)}`;
  } catch {
    return null;
  }
}

export function normalizeWebsiteUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error("Website URL is empty.");
  }

  try {
    const normalized = ensureProtocol(trimmed);
    const finalUrl = new URL(normalized);
    finalUrl.hash = "";
    return finalUrl.toString();
  } catch {
    throw new Error("Invalid website URL provided.");
  }
}

export async function fetchSiteBranding(rawUrl: string) {
  const normalizedUrl = normalizeWebsiteUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  let finalUrl = normalizedUrl;
  let logoUrl: string | null = null;

  try {
    const response = await fetch(normalizedUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    if (response.url) {
      finalUrl = response.url;
    }

    if (response.ok) {
      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("text/html")) {
        const html = await response.text();
        logoUrl = extractLinkIcon(html, finalUrl) ?? extractOgImage(html, finalUrl);
      }

      if (!logoUrl) {
        const fallback = toAbsoluteUrl("/favicon.ico", finalUrl);
        if (fallback) {
          logoUrl = fallback;
        }
      }
    }
  } catch {
    // Ignore network or parsing errors. Fallback applied below.
  } finally {
    clearTimeout(timeout);
  }

  if (!logoUrl) {
    logoUrl = googleFaviconUrl(finalUrl) ?? null;
  }

  return {
    websiteUrl: finalUrl,
    logoUrl,
  };
}
