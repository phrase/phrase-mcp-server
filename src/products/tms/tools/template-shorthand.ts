import { QueryValue } from "../../../lib/http.js";
import { TmsClient } from "../client.js";

interface TemplateItem {
  uid?: string;
  id?: string | number;
  name?: string;
  templateName?: string;
}

interface TemplateListResponse {
  content?: TemplateItem[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function getTemplateName(template: TemplateItem): string {
  return template.templateName ?? template.name ?? "";
}

function getTemplateIdStrings(template: TemplateItem): string[] {
  const values: string[] = [];
  if (template.uid) {
    values.push(template.uid);
  }
  if (template.id !== undefined && template.id !== null) {
    values.push(String(template.id));
  }
  return values;
}

function pickBestTemplate(matches: TemplateItem[], shorthand: string): TemplateItem[] {
  const normalized = normalize(shorthand);

  const exactIdMatches = matches.filter((template) =>
    getTemplateIdStrings(template).some((value) => normalize(value) === normalized),
  );
  if (exactIdMatches.length > 0) {
    return exactIdMatches;
  }

  const exactNameMatches = matches.filter((template) => normalize(getTemplateName(template)) === normalized);
  if (exactNameMatches.length > 0) {
    return exactNameMatches;
  }

  const prefixNameMatches = matches.filter((template) =>
    normalize(getTemplateName(template)).startsWith(normalized),
  );
  if (prefixNameMatches.length > 0) {
    return prefixNameMatches;
  }

  return matches;
}

function asTemplates(data: unknown): TemplateItem[] {
  const response = data as TemplateListResponse;
  if (!response || !Array.isArray(response.content)) {
    return [];
  }
  return response.content;
}

function formatCandidates(templates: TemplateItem[]): string {
  return templates
    .slice(0, 10)
    .map((template) => `${getTemplateName(template) || "(unnamed)"} [uid=${template.uid ?? "n/a"}]`)
    .join(", ");
}

export async function resolveTemplateUidByShorthand(
  client: TmsClient,
  shorthand: string,
  query?: Record<string, QueryValue>,
): Promise<string> {
  const normalized = shorthand.trim();
  if (!normalized) {
    throw new Error("Template shorthand cannot be empty.");
  }

  const searched = await client.paginateGet("/v1/projectTemplates", {
    query: {
      name: normalized,
      ...(query ?? {}),
    },
    pageSize: 50,
    maxPages: 20,
    maxItems: 2000,
    extractItems: asTemplates,
  });
  const searchedTemplates = searched.items as TemplateItem[];

  let candidates = pickBestTemplate(searchedTemplates, normalized);
  if (candidates.length === 0) {
    const listed = await client.paginateGet("/v1/projectTemplates", {
      pageSize: 50,
      maxPages: 20,
      maxItems: 2000,
      extractItems: asTemplates,
    });
    const allTemplates = listed.items as TemplateItem[];
    candidates = pickBestTemplate(
      allTemplates.filter((template) =>
        normalize(getTemplateName(template)).includes(normalize(normalized)) ||
        getTemplateIdStrings(template).some((value) => normalize(value).includes(normalize(normalized))),
      ),
      normalized,
    );
  }

  const withUids = candidates.filter((template) => template.uid);
  if (withUids.length === 1) {
    return withUids[0].uid as string;
  }

  if (withUids.length === 0) {
    throw new Error(`No project template matched '${normalized}'.`);
  }

  throw new Error(
    `Template shorthand '${normalized}' is ambiguous. Matches: ${formatCandidates(withUids)}.`,
  );
}
