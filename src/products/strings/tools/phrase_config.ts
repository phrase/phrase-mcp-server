import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import yaml from "js-yaml";

export interface PhraseSourceParams {
  locale_id?: string;
  file_format?: string;
  branch?: string;
  tags?: string;
  update_translations?: boolean;
  skip_unverification?: boolean;
  update_translation_keys?: boolean;
  [key: string]: unknown;
}

export interface PhraseTargetParams {
  locale_id?: string;
  file_format?: string;
  branch?: string;
  tags?: string;
  [key: string]: unknown;
}

export interface PhraseSource {
  file: string;
  params?: PhraseSourceParams;
}

export interface PhraseTarget {
  file: string;
  params?: PhraseTargetParams;
}

export interface PhraseConfig {
  phrase: {
    access_token?: string;
    project_id?: string;
    file_format?: string;
    push?: { sources?: PhraseSource[] };
    pull?: { targets?: PhraseTarget[] };
  };
}

const CONFIG_CANDIDATES = [".phrase.yml", ".phrase.yaml", "phrase.yml", "phrase.yaml"];

export async function loadPhraseConfig(configPath?: string): Promise<{
  config: PhraseConfig;
  configDir: string;
}> {
  const candidates = configPath ? [configPath] : CONFIG_CANDIDATES;

  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    try {
      const content = await readFile(resolved, "utf-8");
      const config = yaml.load(content) as PhraseConfig;
      if (!config?.phrase) {
        throw new Error(`Invalid phrase config: missing top-level 'phrase' key in ${resolved}`);
      }
      return { config, configDir: dirname(resolved) };
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw err;
    }
  }

  throw new Error(
    `No Phrase config file found. Tried: ${candidates.join(", ")}. ` +
      "Create a .phrase.yml file in your project root.",
  );
}

const PLACEHOLDER_PATTERN = /^<[a-z_]+>$/;

export function hasPlaceholder(value: string): boolean {
  return /<(locale_name|locale_code|tag|format_extension)>/.test(value);
}

export function substitutePlaceholders(
  template: string,
  locale: { name: string; code: string },
  extras?: { tag?: string; format_extension?: string },
): string {
  return template
    .replace(/<locale_name>/g, locale.name)
    .replace(/<locale_code>/g, locale.code)
    .replace(/<tag>/g, extras?.tag ?? "")
    .replace(/<format_extension>/g, extras?.format_extension ?? "");
}

/**
 * Convert a phrase file pattern (with placeholders and globs) into a regex,
 * returning the regex and the ordered capture group names.
 *
 * Example: "./locales/<locale_name>.json"
 *   → regex: /^\.\/locales\/([^/]+)\.json$/
 *   → groups: ["locale_name"]
 */
export function patternToRegex(pattern: string): { regex: RegExp; groups: string[] } {
  const groups: string[] = [];

  // Split on placeholders and glob wildcards, keeping the delimiters
  const tokens = pattern.split(/(<[a-z_]+>|\*\*|\*)/);

  let regexStr = "";
  for (const token of tokens) {
    if (token === "**") {
      regexStr += ".+";
    } else if (token === "*") {
      regexStr += "[^/]+";
    } else if (PLACEHOLDER_PATTERN.test(token)) {
      const groupName = token.slice(1, -1); // strip < >
      groups.push(groupName);
      regexStr += "([^/]+)";
    } else {
      // Escape literal characters
      regexStr += token.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }

  return { regex: new RegExp(`^${regexStr}$`), groups };
}
